import sys, zlib, struct, os, glob

def read_swf(path):
    data = open(path,'rb').read()
    body = data[8:]
    if data[:3] == b'CWS': body = zlib.decompress(body)
    nbits = body[0] >> 3
    pos = (5 + nbits*4 + 7)//8 + 4
    tags = []
    while pos < len(body):
        code_len = struct.unpack_from('<H', body, pos)[0]; pos += 2
        code, length = code_len >> 6, code_len & 0x3F
        if length == 0x3F:
            length = struct.unpack_from('<I', body, pos)[0]; pos += 4
        tags.append((code, body[pos:pos+length]))
        pos += length
        if code == 0: break
    return tags

def extract_sounds(path, outdir, exports_map=None):
    tags = read_swf(path)
    base = os.path.splitext(os.path.basename(path))[0]
    exports = {}
    for code, payload in tags:
        if code == 56:
            n = struct.unpack_from('<H', payload, 0)[0]; p = 2
            for _ in range(n):
                cid = struct.unpack_from('<H', payload, p)[0]; p+=2
                end = payload.index(b'\0', p)
                exports[cid] = payload[p:end].decode('latin1'); p = end+1
    os.makedirs(outdir, exist_ok=True)
    for code, payload in tags:
        if code == 14:
            sid, flags = struct.unpack_from('<HB', payload, 0)
            fmt = flags>>4
            samples = struct.unpack_from('<I', payload, 3)[0]
            if fmt == 2:  # MP3: skip seekSamples u16
                mp3 = payload[9:]
                name = exports.get(sid)
                if name:
                    fn = f'{base}_{name.replace(".wav","")}.mp3'
                else:
                    fn = f'{base}.mp3'
                open(os.path.join(outdir, fn),'wb').write(mp3)
                print(f'{fn}: {len(mp3)}B samples={samples} ({samples/11025:.2f}s@11k)')

# AVM1 action disassembly - just decode Push ops and a few others to recover params
def dis_actions(path):
    tags = read_swf(path)
    base = os.path.basename(path)
    print(f'==== {base}')
    for code, payload in tags:
        if code != 12: continue
        pos = 0
        out = []
        cpool = []
        while pos < len(payload):
            op = payload[pos]; pos += 1
            if op == 0: break
            length = 0
            if op >= 0x80:
                length = struct.unpack_from('<H', payload, pos)[0]; pos += 2
            data = payload[pos:pos+length]; pos += length
            if op == 0x88:  # constant pool
                n = struct.unpack_from('<H', data, 0)[0]; p = 2
                for _ in range(n):
                    e = data.index(b'\0', p)
                    cpool.append(data[p:e].decode('latin1')); p = e+1
                out.append(f'CPOOL({n}): {cpool}')
            elif op == 0x96:  # push
                p = 0; vals = []
                while p < len(data):
                    t = data[p]; p += 1
                    if t == 0:
                        e = data.index(b'\0', p); vals.append(repr(data[p:e].decode('latin1'))); p = e+1
                    elif t == 1: vals.append(struct.unpack_from('<f', data, p)[0]); p += 4
                    elif t == 2: vals.append('null')
                    elif t == 3: vals.append('undef')
                    elif t == 4: vals.append(f'reg{data[p]}'); p += 1
                    elif t == 5: vals.append(bool(data[p])); p += 1
                    elif t == 6:
                        d = struct.unpack('<d', data[p+4:p+8]+data[p:p+4])[0]; vals.append(d); p += 8
                    elif t == 7: vals.append(struct.unpack_from('<i', data, p)[0]); p += 4
                    elif t == 8: vals.append(f'c[{data[p]}]={cpool[data[p]] if data[p]<len(cpool) else "?"}'); p += 1
                    elif t == 9:
                        idx = struct.unpack_from('<H', data, p)[0]
                        vals.append(f'c16[{idx}]={cpool[idx] if idx<len(cpool) else "?"}'); p += 2
                out.append(f'PUSH {vals}')
            else:
                names = {0x81:'GotoFrame',0x83:'GetURL',0x8A:'WaitForFrame',0x8B:'SetTarget',
                         0x8C:'GotoLabel',0x9B:'DefineFunction',0x9D:'If',0x99:'Jump',
                         0x9E:'Call',0x9F:'GotoFrame2',0x87:'StoreRegister',
                         0x0B:'Subtract',0x0A:'Add',0x0C:'Multiply',0x0D:'Divide',
                         0x12:'Not',0x13:'StringEquals',0x17:'Pop',0x1C:'GetVariable',
                         0x1D:'SetVariable',0x3D:'CallFunction',0x40:'NewObject',
                         0x47:'Add2',0x48:'Less2',0x4E:'GetMember',0x4F:'SetMember',
                         0x52:'CallMethod',0x3C:'DefineLocal',0x67:'Greater'}
                nm = names.get(op, f'op{op:02X}')
                if length: out.append(f'{nm} <{length}B>')
                else: out.append(nm)
        for line in out: print('  ', line)

if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'extract':
        for f in sorted(glob.glob(sys.argv[2] + '/*.swf')):
            extract_sounds(f, sys.argv[3])
    else:
        for f in sorted(glob.glob(sys.argv[2] + '/*.swf')):
            dis_actions(f)
