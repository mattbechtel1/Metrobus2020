$redis = Redis.new(
    url: ENV["REDIS_URL"],
    port: ENV["REDIS_PORT"],
    # password: Figaro.env.redis_password, 
    db: ENV["REDIS_DB"]
)