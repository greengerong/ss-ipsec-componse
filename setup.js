import * as child_process from "child_process";
import * as fs from "fs";

const env = process.env;
const vpnIpsecPsk = env.VPN_IPSEC_PSK;
const vpnUser = env.VPN_USER;
const vpnPassword = env.VPN_PASSWORD;

const ssPasswords = [vpnPassword, ...(env.ssPasswords || [])];

// vpn ipsec psk
const shellIpsecPsk = `wget https://git.io/vpnsetup -O vpn.sh && sudo VPN_IPSEC_PSK='${vpnIpsecPsk}' VPN_USER='${vpnUser}' VPN_PASSWORD='${vpnPassword}' sh vpn.sh`;
child_process.execSync(shellIpsecPsk, { stdio: 'inherit' });

// vpn ss: install python2
const shellInstallSS = `sudo apt install python2 -y && curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py && sudo python2 get-pip.py && sudo pip2 install shadowsocks`;
child_process.execSync(shellInstallSS, { stdio: 'inherit' });

// vpn ss: ss config
const ssConfig = {
    "server": "::",
    "local_address": "127.0.0.1",
    "local_port": 1080,
    "port_password": {

    },
    "timeout": 500,
    "method": "aes-256-cfb",
    "fast_open": false
};

let port = 8377;
ssPasswords.forEach(it => {
    ssConfig[port] = it;
    port++
});

fs.writeFileSync(`/etc/shadowsocks.json`, JSON.stringify(ssConfig));

// vpn ss: fix open-ssl script
const openSslScript = fs.readFileSync(`/usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.py`, 'utf8');
const fixScript = openSslScript.replaceAll("libcrypto.EVP_CIPHER_CTX_cleanup", "libcrypto.EVP_CIPHER_CTX_reset");
fs.writeFileSync(`/usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.py`, fixScript);

// vpn ss: start shadow-socket
const shellStartSS = `sudo ssserver -c /etc/shadowsocks.json -d start`;
child_process.execSync(shellStartSS, { stdio: 'inherit' });