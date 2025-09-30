Rails.application.routes.draw do
  get 'metro/busstops/', to: 'metro#bus_stops'
  get 'metro/busstop/:StopId', to: 'metro#bus_stop'
  get 'metro/busstop/', to: 'metro#bus_stop'
  get 'metro/stations'
  get 'metro/station/:station_code', to: 'metro#station'
  get 'metro/busroutes', to: 'metro#bus_route_list'
  get 'metro/lines'
  get 'metro/alerts'

  resources :favorites, only: [:create, :destroy, :update]
  resources :users, only: [:create]
  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  post 'logout', to: 'sessions#destroy'
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
