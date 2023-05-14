import jspb from './util';
import proto from './proto';
import Client from './client';

// import jspb from 'google-protobuf';
// goog.object.extend(exports, proto.pb);
// export default proto;

import init, { 
    sign_transaction, 
    generate_account, 
    import_account,
    generate_key, 
    generate_nonce, 
    encrypt_data, 
    decrypt_data, 
    encrypt, 
    decrypt, 
    encode_user_info, 
    decode_user_info,
    encode_public_key,
    decode_public_key
} from 'wasm-client';

const stringEncoder = new TextEncoder('utf-8');
const stringDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

const CORE_DATA_INT64 = 55;

const CORE_DATA_STRING = 62;
const CORE_DATA_BYTES  = 63;

const CORE_DATA_LIST = 64;
const CORE_DATA_MAP  = 65;

var wasm_lib_initialized = false;
getWasm();

function getInt64(n) {
    var w = new jspb.BinaryEncoder();
    w.writeUint8(CORE_DATA_INT64);
    w.writeInt64(n);
    var d = new proto.pb.Data();
    d.setBytes(w.getBytes());
    return d;
}

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

function getList(list) {
    var list_bytes = list.serializeBinary();

    var w = new jspb.BinaryEncoder();
    w.writeUint8(CORE_DATA_LIST);
    w.writeBytes(list_bytes);
    
    var d = new proto.pb.Data();
    d.setBytes(w.getBytes());
    return d;
}

function setMap(m, k, v){
    var list = m.getMapList();
    for(var i in list){
        var item = list[i];
        if(item.getName() == k){
            item.setValue(v);
            return
        }
    }
    var entry = new proto.pb.DataEntry();
    entry.setName(k);
    entry.setValue(v);
    list.push(entry);
}

function getPayload(payload) {
    var ret;
    if(payload != null){
        ret = new proto.pb.DataMap();
        if(payload.code != null){
            var cm = new proto.pb.DataMap();
            var s = payload.code.data;
            if(s && s.length > 0 ){
                setMap(cm, "data", getString(s));

                s = payload.code.abi;
                if(s && s.length > 0){
                    setMap(cm, "abi", getString(s));
                }
            }
            setMap(ret, "code", getMap(cm));
        }
        if(payload.contract != null){
            var cm = new proto.pb.DataMap();
            var account = payload.contract.account;
            if(account != null){
                var am = get_account_info(account);
                setMap(cm, "account", getMap(am));
            }
            var method = payload.contract.method;
            if(method && method.length > 0){
                setMap(cm, "method", getString(method));
            }
            var params = payload.contract.params;
            if(params && params.length > 0){
                setMap(cm, "params", getString(params));
            }
            var inputs = payload.contract.inputs;
            if(inputs && inputs.length > 0){
                setMap(cm, "inputs", getString(inputs));
            }
            var outputs = payload.contract.outputs;
            if(outputs && outputs.length > 0){
                setMap(cm, "outputs", getString(outputs));
            }
            setMap(ret, "contract", getMap(cm));
        }
        if(payload.page != null){
            var cm = new proto.pb.DataMap();
            var s = payload.page.data;
            if(s && s.length > 0){
                setMap(cm, "data", getString(s));

                var n = payload.page.name;
                if(n && n.length > 0){
                    setMap(cm, "name", getString(n));
                }
            }
            setMap(ret, "page", getMap(cm));
        }
        if(payload.user != null){
            var cm = get_user_info(payload.user, true);
            setMap(ret, "user", getMap(cm));
        }
        if(payload.meta != null){
            var cm = get_meta_info(payload.meta);
            setMap(ret, "meta", getMap(cm));
        }
        if(payload.token != null){
            var cm = get_token_info(payload.token);
            setMap(ret, "token", getMap(cm));
        }
    }else{
        ret = null;
    }
    return ret;
}

function get_token_info(token) {
    var cm = new proto.pb.DataMap();
    var s = token.symbol;
    if(s && s.length > 0){
        setMap(cm, "symbol", getString(s));
    }
    var n = token.index;
    if(n != null){
        setMap(cm, "index", getInt64(n));
    }
    var items = token.items;
    if(items){
        var list = new proto.pb.DataList();
        for(var i in items) {
            var item = items[i];
            var im = get_token_item(item);
            list.getListList().push(getMap(im));
        }
        setMap(cm, "items", getList(list));
    }
    return cm;
}

function get_token_item(item) {
    var cm = new proto.pb.DataMap();
    var s = item.name;
    if(s && s.length > 0){
        setMap(cm, "name", getString(s));
    }
    s = item.value;
    if(s && s.length > 0){
        setMap(cm, "value", getString(s));
    }
    return cm;
}

function get_meta_info(meta) {
    var cm = new proto.pb.DataMap();
    var s = meta.symbol;
    if(s && s.length > 0){
        setMap(cm, "symbol", getString(s));
    }
    var n = meta.total;
    if(n != null){
        setMap(cm, "total", getInt64(n));
    }
    var items = meta.items;
    if(items){
        var list = new proto.pb.DataList();
        for(var i in items) {
            var item = items[i];
            var im = get_meta_item(item);
            list.getListList().push(getMap(im));
        }
        setMap(cm, "items", getList(list));
    }
    return cm;
}

function get_meta_item(item) {
    var cm = new proto.pb.DataMap();
    var s = item.name;
    if(s && s.length > 0){
        setMap(cm, "name", getString(s));
    }
    s = item.type;
    if(s && s.length > 0){
        setMap(cm, "type", getString(s));
    }
    var options = item.options;
    if(options){
        var list = new proto.pb.DataList();
        for(var i in options) {
            var o = options[i];
            list.getListList().push(getString(o));
        }
        setMap(cm, "options", getList(list));
    }
    s = item.desc;
    if(s && s.length > 0){
        setMap(cm, "desc", getString(s));
    }
    return cm;
}

function get_user_info(user, has_data) {
    var cm = new proto.pb.DataMap();
    if(has_data){
        var s = user.data;
        if(s && s.length > 0){
            setMap(cm, "data", getString(s));
        }
    }else{
        var s = user.hash;
        if(s && s.length > 0){
            setMap(cm, "hash", getString(s));
        }
    }
    var account = user.account;
    if(account != null){
        var am = get_account_info(account);
        setMap(cm, "account", getMap(am));
    }
    var k = user.key;
    if(k && k.length > 0){
        setMap(cm, "key", getString(k));
    }
    var n = user.nonce;
    if(n && n.length > 0){
        setMap(cm, "nonce", getString(n));
    }
    return cm;
}

function get_account_info(info) {
    var cm = new proto.pb.DataMap();
    var data = info.data;
    if(data && data.length > 0){
        setMap(cm, "data", getString(data))
    }
    var code = info.code;
    if(code && code.length > 0){
        setMap(cm, "code", getString(code));
    }
    return cm;
}

function getTransaction(tx) {
    var account = tx.account;
    var sequence = tx.sequence;
    var secret = tx.secret;
    var gas = tx.gas;
    var payload = getPayload(tx.payload);
    
    var m = new proto.pb.DataMap();
    setMap(m, "account", getString(account));
    setMap(m, "sequence", getString(sequence));
    setMap(m, "secret", getString(secret));
    setMap(m, "gas", getString(gas));
    if(payload != null){
        setMap(m, "payload", getMap(payload));
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
    new: function(url, root) {
        return new Client(url, root);
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
    import: function(secret) {
        getWasm()

        var ret = import_account(secret);
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
            callback(bytes, {
                name: f.name,
                size: f.size,
                type: f.type
            });
        };
        fr.readAsArrayBuffer(f);
    },
    download_file: function(name, type, data) {
        var blob = new Blob([data], {type: type && "application/octet-stream"});
        const reader = new FileReader();
        reader.readAsDataURL(blob)
        reader.onload = (e) => {
            const a = document.createElement('a')
            a.download = name;
            a.href = e.target.result;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    },
    view_file: function(name, type, data) {
        var blob = new Blob([data], {type: type});
        var fileURL = URL.createObjectURL(blob);
        window.open(fileURL);
    },
    encrypt_user_data(account, contract, hex) {
        getWasm();

        var key = generate_key();
        var nonce = generate_nonce();
        var encrypted_key = encrypt(account.public, key);
        var encrypted_nonce = encrypt(account.public, nonce);
        var encrypted_hex = encrypt_data(key, nonce, hex);
        return {
            account: {
                data:account.address,
                code:contract
            },
            key: encrypted_key,
            nonce: encrypted_nonce,
            data: encrypted_hex
        };
    },
    decrypt_user_data(account, user_info, hex) {
        getWasm();

        var key = decrypt(account.private, user_info.key);
        var nonce = decrypt(account.private, user_info.nonce);
        var decrypted_hex = decrypt_data(key, nonce, hex);
        return decrypted_hex;
    },
    decode_user_data(hex) {
        getWasm();

        var ret = decode_user_info(hex);
        var list = ret.split(",");
        return {
            account: {
                data:list[0],
                code:list[1]
            },
            key: list[2],
            nonce: list[3],
            hash: list[4]
        };
    },
    encode_public_key(hex) {
        getWasm();

        return encode_public_key(hex);
    },
    decode_public_key(hex) {
        getWasm();

        return decode_public_key(hex);
    },
    transfer_user_data(account, contract, peer_pk, user_info) {
        getWasm();
        
        var key = decrypt(account.private, user_info.key);
        var nonce = decrypt(account.private, user_info.nonce);

        var encrypted_key = encrypt(peer_pk, key);
        var encrypted_nonce = encrypt(peer_pk, nonce);

        var m = get_user_info({
            account: {
                data:account.address,
                code:contract
            },
            key:encrypted_key,
            nonce:encrypted_nonce,
            hash:user_info.hash
        }, false);
        var cm = getMap(m);
        var bs = cm.getBytes();
        var hex = this.bytes_to_hex(bs);
        return encode_user_info(hex);
    }
};
