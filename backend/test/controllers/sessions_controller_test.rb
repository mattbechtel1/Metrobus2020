require 'test_helper'

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "should login with valid credentials" do
    post login_url, params: { email: users(:one).email, password: 'password' }, as: :json
    assert_response :accepted
    json = response.parsed_body
    assert_equal users(:one).email, json['email']
  end

  test "should reject invalid password" do
    post login_url, params: { email: users(:one).email, password: 'wrong' }, as: :json
    assert_response :unauthorized
  end

  test "should reject unknown email" do
    post login_url, params: { email: 'nobody@example.com', password: 'password' }, as: :json
    assert_response :unauthorized
  end
end
