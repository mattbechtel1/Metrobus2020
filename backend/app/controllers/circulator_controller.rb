require 'net/http'
require 'json'

class CirculatorController < ApplicationController
    AGENCY = 'dc-circulator'
    CACHE = $redis
    PREDICTION_URL = 'http://webservices.nextbus.com/service/publicXMLFeed'

    def bus_stops
        unless CACHE.exists?("busstops-#{params[:r]}")
            response = fetch_data(PREDICTION_URL, {
                command: 'routeConfig',
                a: AGENCY,
            }.merge(strong_params.to_h))
            CACHE.set("busstops-#{params[:r]}", response, ex: ONE_WEEK)
        end
        render json: Hash.from_xml(CACHE.get("busstops-#{params[:r]}")).to_json
    end

    def bus_stop
        unless CACHE.exists?("circ-stop-#{params[:stopId]}")
            response = fetch_data(PREDICTION_URL, {
                command: 'predictions',
                a: AGENCY,
            }.merge(strong_params.to_h))
            CACHE.set("circ-stop-#{params[:stopId]}", response, ex: QUARTER_MINUTE)
        end
        render json: Hash.from_xml(CACHE.get("circ-stop-#{params[:stopId]}")).to_json
    end

    def bus_route_list
        unless CACHE.exists?("allCirculators")
            response = fetch_data(PREDICTION_URL, {
                command: 'routeList',
                a: AGENCY
            })
            CACHE.set("allCirculators", response, ex: ONE_WEEK)
        end
        render json: Hash.from_xml(CACHE.get("allCirculators")).to_json
    end
    
    private

    def fetch_data url, params
        uri = URI(url)
        uri.query = URI.encode_www_form(params)
        response = Net::HTTP.get_response(uri)
        return response.body if response.is_a?(Net::HTTPSuccess)
    end

    def strong_params
        params.permit(:stopId, :r)
    end

end
