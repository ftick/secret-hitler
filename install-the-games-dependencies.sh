#!/bin/bash

set -e

# Update sources, then dist-upgrade
#sudo apt-get update
#sudo apt-get dist-upgrade

# Install git, so that we can get the secret hitler
# sources
sudo apt-get install -y git

# Install node and build-essentials in order to be
# able to install the game
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

# Install nginx and postgres
sudo apt-get install -y nginx
sudo apt-get install -y postgresql
