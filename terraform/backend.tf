terraform {
    backend "remote" {
        hostname = "app.terraform.io"
        organization = "demerstech"

        workspaces {
            name = "isu-dining-informer"
        }
    }
}