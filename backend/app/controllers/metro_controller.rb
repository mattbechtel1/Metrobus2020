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
    unless CACHE.exists?("dc-busstops-#{params[:RouteID]}")
      response = fetch_data(BUS_ROUTE_SCHEDULE_URL, nil)
      CACHE.setex("dc-busstops-#{params["RouteID"]}", ONE_WEEK, response)
    end

    render json: {:alerts => CACHE.lrange("dc-alert-#{params[:RouteID]}", 0, -1), :bus => JSON.parse(CACHE.get("dc-busstops-#{params[:RouteID]}")) }.to_json
  end

  def bus_stop
    unless CACHE.exists?("dc-stop-#{params[:StopId]}")
      response = fetch_data(BUS_PREDICTIONS_URL, nil)
      CACHE.setex("dc-stop-#{params[:StopId]}", QUARTER_MINUTE, response)
    end

    render json: { 
      :alerts => CACHE.lrange("dc-alert-#{params[:routeId]}", 0, -1),
      :stop => JSON.parse(CACHE.get("dc-stop-#{params[:StopId]}")) }.to_json
  end

  def bus_route_list
    unless CACHE.exists?('dc-allBuses')
      response = fetch_data(BUS_ROUTES_URL, nil)
      CACHE.setex('dc-allBuses', ONE_WEEK, response)
    end
    
    render json: CACHE.get('dc-allBuses')
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
      unless CACHE.exists?("dc-#{params[:Linecode]}-stations")
        CACHE.setex("dc-#{params[:Linecode]}-stations", ONE_WEEK, sorted_json_response_from_wmata)
      end

      render json: { 
        :alerts => CACHE.lrange("dc-alert-#{COLOR_DICT[params[:Linecode]]}", 0, -1), 
        :stations => JSON.parse(CACHE.get("dc-#{params[:Linecode]}-stations"))
      }.to_json
    
    else
      unless CACHE.exists?('dc-allStations')
        CACHE.setex('dc-allStations', ONE_WEEK, sorted_json_response_from_wmata)
      end

      render json: CACHE.get('dc-allStations')
    end
  end

  def station
    unless CACHE.exists?("dc-station-#{params[:station_code]}")
      response = fetch_data("#{STATION_PREDICTIONS_URL}/#{params[:station_code]}", nil)
      CACHE.setex("dc-station-#{params[:station_code]}", THIRD_MINUTE, response)
    end

    render json: CACHE.get("dc-station-#{params[:station_code]}")
  end

  def lines
    unless CACHE.exists?("dc-lines")
      response = fetch_data(RAIL_LINES_URL, nil)
      CACHE.setex('dc-lines', ONE_WEEK, response)
    end

    render json: CACHE.get('dc-lines')
  end


  # alerts does not return data to the frontend
  def alerts
    unless CACHE.get('dc-alert-times')
      bus_response = fetch_data(BUS_ALERTS_URL, "{body}")
      bus_feed = Transit_realtime::FeedMessage.decode(bus_response)
      
      bus_feed.entity.filter { |entity| entity.id[0] == "1" }.each do |entity|
        entity.alert.informed_entity.each do |bus|
          CACHE.rpush("dc-alert-#{bus.route_id}", entity.alert.header_text.translation[0].text)
          CACHE.expire("dc-alert-#{bus.route_id}", TEN_MINUTES)
        end
      end

      train_response = fetch_data(RAIL_ALERTS_URL, "{body}")
      train_feed = Transit_realtime::FeedMessage.decode(train_response)
      train_feed.entity.each do |entity|
        entity.alert.informed_entity.each do |alert|
          CACHE.rpush("dc-alert-#{alert.route_id}", entity.alert.description_text.translation[0].text)
          CACHE.expire("dc-alert-#{alert.route_id}", TEN_MINUTES)
        end
      end

      CACHE.setex('dc-alert-times', TEN_MINUTES, true)
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