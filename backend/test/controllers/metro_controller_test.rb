require 'test_helper'

class MetroControllerTest < ActionDispatch::IntegrationTest
  test "should get buses" do
    get metro_busstops_url
    assert_response :success
  end

  test "should get bus" do
    get metro_busstop_url
    assert_response :success
  end

  test "should get stations" do
    get metro_stations_url
    assert_response :success
  end

  test "station predictions include alerts for the lines serving the station" do
    code = "TEST#{Process.pid}"
    cache = MetroController::CACHE
    trains = [{ "Line" => "BL" }, { "Line" => "OR" }, { "Line" => "BL" }, { "Line" => "No" }]
    cache.setex("dc-station-#{code}", 60, { "Trains" => trains }.to_json)
    original = %w[BLUE ORANGE].to_h { |line| [line, cache.lrange("dc-alert-#{line}", 0, -1)] }
    cache.del("dc-alert-BLUE", "dc-alert-ORANGE")
    cache.rpush("dc-alert-BLUE", ["Blue delay", "Shared alert"])
    cache.rpush("dc-alert-ORANGE", ["Shared alert"])

    get "/metro/station/#{code}"

    assert_response :success
    json = response.parsed_body
    assert_equal 4, json["Trains"].size
    assert_equal ["Blue delay", "Shared alert"], json["alerts"]
  ensure
    cache.del("dc-station-#{code}", "dc-alert-BLUE", "dc-alert-ORANGE")
    original&.each { |line, alerts| cache.rpush("dc-alert-#{line}", alerts) if alerts.any? }
  end

end
