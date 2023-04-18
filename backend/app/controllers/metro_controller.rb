require 'net/http'
require 'protobuf'
require 'google/transit/gtfs-realtime.pb'
require 'json'

class MetroController < ApplicationController
  COLOR_DICT = {
    "BL" => "BLUE",
    "OR" => "ORANGE",
    "SV" => "SILVER",
    "GR" => "GREEN",
    "RD" => "RED",
    "YL" => "YELLOW"
  }

  CACHE = $redis

  BUS_ROUTE_SCHEDULE_URL = 'https://api.wmata.com/Bus.svc/json/jRouteSchedule'
  BUS_ROUTES_URL = 'https://api.wmata.com/Bus.svc/json/jRoutes'
  BUS_ALERTS_URL = 'https://api.wmata.com/gtfs/bus-gtfsrt-alerts.pb'
  BUS_PREDICTIONS_URL = 'https://api.wmata.com/NextBusService.svc/json/jPredictions/'

  STATIONS_URL = 'https://api.wmata.com/Rail.svc/json/jStations'
  RAIL_LINES_URL = 'https://api.wmata.com/Rail.svc/json/jLines'
  RAIL_ALERTS_URL = 'https://api.wmata.com/gtfs/rail-gtfsrt-alerts.pb'
  STATION_PREDICTIONS_URL = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction'

  def bus_stops    
    unless CACHE.exists?("busstops-#{params[:RouteID]}")
      response = fetch_data(BUS_ROUTE_SCHEDULE_URL, nil)
      CACHE.set("busstops-#{params["RouteID"]}", response, {ex: ONE_WEEK})
    end

    render json: {:alerts => CACHE.lrange("alert-#{params[:RouteID]}", 0, -1), :bus => JSON.parse(CACHE.get("busstops-#{params[:RouteID]}")) }.to_json
  end

  def bus_stop
    unless CACHE.exists?("stop-#{params[:StopId]}")
      response = fetch_data(BUS_PREDICTIONS_URL, nil)
      CACHE.set("stop-#{params[:StopId]}", response, {ex: QUARTER_MINUTE})
    end

    render json: { 
      :alerts => CACHE.lrange("alert-#{params[:routeId]}", 0, -1),
      :stop => JSON.parse(CACHE.get("stop-#{params[:StopId]}")) }.to_json
  end

  def bus_route_list
    unless CACHE.exists?('allBuses')
      response = fetch_data(BUS_ROUTES_URL, nil)
      CACHE.set('allBuses', response, {ex: ONE_WEEK})
    end
    
    render json: CACHE.get('allBuses')
  end

  def stations
    def sorted_json_response_from_wmata
      # Fetches station list from wamta and sorts accordingly
      response = fetch_data(STATIONS_URL, nil)
      response = JSON.parse(response)
      if params[:Linecode]
        response["Stations"].sort_by { |station| station["Lon"] }.to_json
      else
        response["Stations"].sort_by { |station| station["Name"] }.to_json
      end
    end


    if params[:Linecode]
      unless CACHE.exists?("#{params[:Linecode]}-stations")
        CACHE.set("#{params[:Linecode]}-stations", sorted_json_response_from_wmata, {ex: ONE_WEEK})
      end

      render json: { 
        :alerts => CACHE.lrange("alert-#{COLOR_DICT[params[:Linecode]]}", 0, -1), 
        :stations => JSON.parse(CACHE.get("#{params[:Linecode]}-stations"))
      }.to_json
    
    else
      unless CACHE.exists?('allStations')
        CACHE.set('allStations', sorted_json_response_from_wmata, {ex: ONE_WEEK})
      end

      render json: CACHE.get('allStations')
    end
  end

  def station
    unless CACHE.exists?("station-#{params[:station_code]}")
      response = fetch_data("#{STATION_PREDICTIONS_URL}/#{params[:station_code]}", nil)
      CACHE.set("station-#{params[:station_code]}", response, {ex: THIRD_MINUTE})
    end

    render json: CACHE.get("station-#{params[:station_code]}")
  end

  def lines
    unless CACHE.exists?("lines")
      response = fetch_data(RAIL_LINES_URL, nil)
      CACHE.set('lines', response, {ex: ONE_WEEK})
    end

    render json: CACHE.get('lines')
  end


  # alerts does not return data to the frontend
  def alerts
    unless CACHE.get('alert-times')
      bus_response = fetch_data(BUS_ALERTS_URL, "{body}")
      bus_feed = Transit_realtime::FeedMessage.decode(bus_response)
      
      bus_feed.entity.filter { |entity| entity.id[0] == "1" }.each do |entity|
        entity.alert.informed_entity.each do |bus|
          CACHE.rpush("alert-#{bus.route_id}", entity.alert.header_text.translation[0].text)
          CACHE.expire("alert-#{bus.route_id}", TEN_MINUTES)
        end
      end

      train_response = fetch_data(RAIL_ALERTS_URL, "{body}")
      train_feed = Transit_realtime::FeedMessage.decode(train_response)
      train_feed.entity.each do |entity|
        entity.alert.informed_entity.each do |alert|
          CACHE.rpush("alert-#{alert.route_id}", entity.alert.description_text.translation[0].text)
          CACHE.expire("alert-#{alert.route_id}", TEN_MINUTES)
        end
      end

      CACHE.set('alert-times', true, ex: TEN_MINUTES)
      render json: bus_feed
    end
  end

  private

  def fetch_data(url, body)
    uri = URI(url)
    uri.query = URI.encode_www_form(strong_params.to_h)
    request = Net::HTTP::Get.new(uri.request_uri)
    request['api_key'] = Figaro.env.wmata_primary_key
    request.body = body
    
    response = Net::HTTP.start(uri.host, uri.port, :use_ssl => uri.scheme == 'https') do |http|
      http.request(request)
    end

    response.body
  end

  def strong_params
    params.permit(:RouteID, :IncludingVariations, :StopId, :Linecode)
  end

end