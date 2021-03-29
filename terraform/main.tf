provider "google" {
  project     = var.project
  region      = var.region
  credentials = var.GCP_APP_CREDS
}

module "food_scraper" {
  source                  = "./modules/function"
  project                 = var.project
  function_name           = "foodScraper"
  function_entry_point    = "foodScraper"
  ISU_DINING_API_ENDPOINT = var.ISU_DINING_API_ENDPOINT
}

# Use firestore
resource "google_app_engine_application" "app" {
  project       = var.project
  location_id   = var.location
  database_type = "CLOUD_FIRESTORE"
}
