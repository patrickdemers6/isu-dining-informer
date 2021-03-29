provider "google" {
  project = var.project
  region  = var.region
  credentials = var.GCP_APP_CREDS
}

module "food_scraper" {
  source               = "./modules/function"
  project              = var.project
  function_name        = "foodScraper"
  function_entry_point = "foodScraper"
}