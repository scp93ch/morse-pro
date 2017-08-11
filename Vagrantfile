hostname = "morse-pro"
ram = "1024"

$script = <<SCRIPT
run-parts /vagrant/provisioning
SCRIPT

Vagrant.configure("2") do |config|

  config.vm.box = "boxcutter/ubuntu1604"

  if Vagrant.has_plugin?("vagrant-cachier")
    # Configure cached packages to be shared between instances of the same base box.
    # More info on http://fgrehm.viewdocs.io/vagrant-cachier/usage
    config.cache.scope = :box
  end

  config.vm.hostname = hostname

  config.vm.synced_folder ".", "/vagrant"

  config.vm.provider "virtualbox" do |vb|
  	vb.memory = ram
  	vb.name = hostname
  end

  config.ssh.forward_agent = true

  config.vm.provision "shell", inline: $script

end
