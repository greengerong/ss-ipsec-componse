const child_process = require("child_process");
const fs = require("fs");

const env = process.env;

const vpnIpsecPsk = env.VPN_IPSEC_PSK;
const vpnUser = env.VPN_USER;
const vpnPassword = env.VPN_PASSWORD;
const ssPasswords = [vpnPassword, ...(env.ssPasswords || [])];
let port = env.VPN_PORT_SEED || 8377;
console.log(`***** env with`, JSON.stringify({
    vpnIpsecPsk,
    vpnUser,
    vpnPassword,
    ssPasswords,
    port
}));

console.log(`***** vpn ipsec psk start ...`);
// vpn ipsec psk
const shellIpsecPsk = `wget https://git.io/vpnsetup -O vpn.sh && sudo VPN_IPSEC_PSK='${vpnIpsecPsk}' VPN_USER='${vpnUser}' VPN_PASSWORD='${vpnPassword}' sh vpn.sh`;
child_process.execSync(shellIpsecPsk, { stdio: 'inherit' });

console.log(`***** vpn ss: install python2 ...`);

// vpn ss: install python2
const shellInstallSS = `sudo apt install python2 -y && curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py && sudo python2 get-pip.py && sudo pip2 install shadowsocks`;
child_process.execSync(shellInstallSS, { stdio: 'inherit' });

console.log(`***** vpn ss: ss config start ...`);
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

ssPasswords.forEach(it => {
    ssConfig.port_password[port] = it;
    port++
});

console.log(`***** vpn ss: ss config`, JSON.stringify(ssConfig));

fs.writeFileSync(`/etc/shadowsocks.json`, JSON.stringify(ssConfig));

// vpn ss: delete openssl.pyc
console.log(`***** vpn ss: delete openssl.pyc`);
// fs.unlinkSync(`/usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.pyc`);
const shellRmPyc = `sudo rm -rf /usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.pyc`;
child_process.execSync(shellRmPyc, { stdio: 'inherit' });

// vpn ss: fix open-ssl script
console.log(`***** vpn ss: fix open-ssl script`);
const openSslScript = fs.readFileSync(`/usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.py`, 'utf8');
const fixScript = openSslScript.replaceAll("libcrypto.EVP_CIPHER_CTX_cleanup", "libcrypto.EVP_CIPHER_CTX_reset");
fs.writeFileSync(`/usr/local/lib/python2.7/dist-packages/shadowsocks/crypto/openssl.py`, fixScript);

libcrypto.EVP_CIPHER_CTX_reset
libcrypto.EVP_CIPHER_CTX_reset

console.log(`***** vpn ss: start shadow-socket`);
// vpn ss: start shadow-socket
const shellStartSS = `sudo ssserver -c /etc/shadowsocks.json -d start`;
child_process.execSync(shellStartSS, { stdio: 'inherit' });

console.log(`***** finish all setup done.`);


