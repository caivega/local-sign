import jspb from './util';
import proto from './proto';
import Client from './client';

import init, { sign_transaction, generate_account, generate_key, generate_nonce, encrypt_data, decrypt_data, encrypt, decrypt } from 'wasm-client';

const stringEncoder = new TextEncoder('utf-8');
const stringDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

const CORE_DATA_STRING = 62;
const CORE_DATA_BYTES  = 63;

const CORE_DATA_LIST = 64;
const CORE_DATA_MAP  = 65;

var wasm_lib_initialized = false;
getWasm();

function getString(s) {
    var w = new jspb.BinaryEncoder();
    w.writeUint8(CORE_DATA_STRING);
    w.writeString(s);
    var d = new proto.pb.Data();
    d.setBytes(w.getBytes());
    return d;
}

function getMap(m) {
    var ms = m.serializeBinary();

    var w = new jspb.BinaryEncoder();
    w.writeUint8(CORE_DATA_MAP);
    w.writeBytes(ms);
    
    var d = new proto.pb.Data();
    d.setBytes(w.getBytes());
    return d;
}

function getPayload(payload) {
    var ret;
    if(payload != null){
        ret = new proto.pb.DataMap();
        if(payload.code != null){
            var cm = new proto.pb.DataMap();
            var s = payload.code.data;
            if(s && s.length > 0 ){
                cm.getMapMap().set("data", getString(s));

                s = payload.code.abi;
                if(s && s.length > 0){
                    cm.getMapMap().set("abi", getString(s));
                }
            }
            ret.getMapMap().set("code", getMap(cm));
        }
        if(payload.contract != null){
            var cm = new proto.pb.DataMap();
            var account = payload.contract.account;
            if(account && account.length > 0){
                cm.getMapMap().set("account", getString(account));
            }
            var method = payload.contract.method;
            if(method && method.length > 0){
                cm.getMapMap().set("method", getString(method));
            }
            var params = payload.contract.params;
            if(params && params.length > 0){
                cm.getMapMap().set("params", getString(params));
            }
            var inputs = payload.contract.inputs;
            if(inputs && inputs.length > 0){
                cm.getMapMap().set("inputs", getString(inputs));
            }
            var outputs = payload.contract.outputs;
            if(outputs && outputs.length > 0){
                cm.getMapMap().set("outputs", getString(outputs));
            }
            ret.getMapMap().set("contract", getMap(cm));
        }
        if(payload.page != null){
            var cm = new proto.pb.DataMap();
            var s = payload.page.data;
            if(s && s.length > 0){
                cm.getMapMap().set("data", getString(s));

                var n = payload.page.name;
                if(n && n.length > 0){
                    cm.getMapMap().set("name", getString(n));
                }
            }
            ret.getMapMap().set("page", getMap(cm));
        }
        if(payload.user != null){
            var cm = new proto.pb.DataMap();
            var s = payload.user.data;
            if(s && s.length > 0){
                cm.getMapMap().set("data", getString(s));

                var a = payload.user.account;
                if(a && a.length > 0){
                    cm.getMapMap().set("account", getString(a));
                }

                var k = payload.user.key;
                if(k && k.length > 0){
                    cm.getMapMap().set("key", getString(k));
                }

                var n = payload.user.nonce;
                if(n && n.length > 0){
                    cm.getMapMap().set("nonce", getString(n));
                }
            }
            ret.getMapMap().set("user", getMap(cm));
        }
    }else{
        ret = null;
    }
    return ret;
}

function getTransaction(tx) {
    var from = tx.from;
    var secret = tx.secret;
    var sequence = tx.sequence;
    var to = tx.to;
    var gas = tx.gas;
    var payload = getPayload(tx.payload);
    
    var m = new proto.pb.DataMap();
    m.getMapMap().set("from", getString(from));
    m.getMapMap().set("secret", getString(secret));
    m.getMapMap().set("to", getString(to));
    m.getMapMap().set("gas", getString(gas));
    m.getMapMap().set("sequence", getString(sequence));
    if(payload != null){
        m.getMapMap().set("payload", getMap(payload));
    }

    var bs = m.serializeBinary();
    var w = new jspb.BinaryEncoder();
    w.writeUint8(CORE_DATA_MAP);
    w.writeBytes(bs);
    var blob = bytesToHex(w.getBytes());
    console.log("tx", blob);
    return blob;
}

function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
}

function hexToBytes(hex) {
    return new Uint8Array(hex.match(/[\da-fA-F]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
}

function getWasm() {
    if(!wasm_lib_initialized){
        init().then(() => {
            wasm_lib_initialized = true;
        });
    }
}

function getWasmSigner() {
    getWasm();
    return sign_transaction;
}

function getWasmGenerator() {
    getWasm();
    return generate_account;
}

export default {
    new: function(url) {
        return new Client(url);
    },
    bytes_to_hex(bs){
        return bytesToHex(bs);
    },
    hex_to_bytes(hex){
        return hexToBytes(hex);
    },
    get_string(bs){
        return stringDecoder.decode(bs);
    },
    get_bytes(s){
        return stringEncoder.encode(s);
    },
    generate: function(passphrase) {
        var generator = getWasmGenerator();
        var ret = generator(passphrase);
        var list = ret.split(",");
        return {
            type:list[0],
            address:list[1],
            private:list[2],
            public:list[3]
        };
    },
    sign: function(tx) {
        var signer = getWasmSigner();
        var txBlob = getTransaction(tx);
        return signer(txBlob);
    },
    load_file: function(f, callback) {
        var fr = new FileReader();
        fr.onloadend = function (e) {
            var data = e.target.result;
            var bytes = new Uint8Array(data);
            callback(bytes);
        };
        fr.readAsArrayBuffer(f);
    },
    encrypt_user_data(account, contract, hex) {
        getWasm();
        var key = generate_key();
        var nonce = generate_nonce();
        var encrypted_key = encrypt(account.public, key);
        var encrypted_nonce = encrypt(account.public, nonce);
        var encrypted_hex = encrypt_data(key, nonce, hex);
        return {
            account: contract,
            key: encrypted_key,
            nonce: encrypted_nonce,
            data: encrypted_hex
        };
    }
};
