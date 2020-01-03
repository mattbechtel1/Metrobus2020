class SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:email])
    return head(:forbidden) unless user.authenticate(params[:password])
    session[:user_id] = user.id
    
    render json: UserSerializer.new(user).to_serialized_json
  end

  def destroy
    session.delete :email
  end
end