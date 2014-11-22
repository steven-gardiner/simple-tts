espeak --version  || echo "espeak must be installed"
(lame --version | head -1) || echo "lame must be installed"
oggenv --version || echo "vorbis-tools must be installed"
aplay --version || echo "alsa-utils must be installed"
