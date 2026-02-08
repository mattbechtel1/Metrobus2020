<?php 
require_once('vendor/autoload.php');

if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}


$dc_url = $_ENV['DC_URL'];
$seattle_url = $_ENV['SEATTLE_URL'];

// include_once("index.html"); 
?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        const DC_URL = <?php echo json_encode($dc_url); ?>;
        console.log("DC Metro API URL is " + DC_URL);
        const SEATTLE_URL = <?php echo json_encode($seattle_url); ?>;
        console.log("Seattle API URL is " + SEATTLE_URL);
    </script>
    <script type='text/javascript' src='config.js'></script>
    <script type='text/javascript' src='metrobus.js'></script>
    <script type='text/javascript' src='metrorail.js'></script>
    <script type='text/javascript' src='sessions.js'></script>
    <script type='text/javascript' src='alarm.js'></script>
    <script type='text/javascript' src='common_components.js'></script>
    <script type='text/javascript' src='favorites.js'></script>
    <script type='text/javascript' src='notifications.js'></script>


    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css">
    <link rel="stylesheet" href="assets/custom.css">
    <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
    <title>MultiCity Metrobus Predictor</title>
  </head>
  <body>
    <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
            <a class='navbar-item' id='log'>Login</a>
            <a class='navbar-item' id='search-by-stop'>Metrobus Stops</a>
            <a class='navbar-item' id='search-by-route'>Metrobus Routes</a>
            <a class='navbar-item' id='search-by-station'>Metrorail Stations</a>
            <a class='navbar-item' id='search-by-line'>Metrorail Lines</a>
            <a class='navbar-item' id='favorites' hidden>Favorites</a>
      
            <!-- <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false">
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a> -->

          <select id="locale", class="navbar-select">
            <option selected disabled hidden>Select Metro Area</option>
            <option value="washington">Washington, DC</option>
            <option value="seattle">Seattle, WA</option>
          </select>
        </div>
      </nav>

      
      
      <section class="section">
          <div class="container">
              <h1 class="title", id="app_header">My City Metrobus App</h1>
          </div>
        </section>
        
        <div class="content" id="main-container"></div>

        <div id='notification-block'></div>
  </body>
</html>