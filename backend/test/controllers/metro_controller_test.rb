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

end
