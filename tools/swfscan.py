import sys, zlib, struct, os, glob

TAGS = {0:'End',1:'ShowFrame',2:'DefineShape',9:'SetBackgroundColor',12:'DoAction',
        14:'DefineSound',15:'StartSound',17:'DefineButtonSound',18:'SoundStreamHead',
        19:'SoundStreamBlock',22:'DefineShape2',26:'PlaceObject2',28:'RemoveObject2',
        32:'DefineShape3',34:'DefineButton2',36:'DefineBitsLossless2',37:'DefineEditText',
        39:'DefineSprite',43:'FrameLabel',45:'SoundStreamHead2',46:'DefineMorphShape',
        48:'DefineFont2',56:'ExportAssets',59:'DoInitAction',69:'FileAttributes',
        76:'SymbolClass',82:'DoABC',86:'DefineSceneAndFrameLabelData',88:'DefineFontName'}

FORMATS = {0:'raw',1:'ADPCM',2:'MP3',3:'raw-le',6:'Nellymoser'}
RATES = {0:5512,1:11025,2:22050,3:44100}

def read_swf(path):
    data = open(path,'rb').read()
    sig = data[:3]
    body = data[8:]
    if sig == b'CWS': body = zlib.decompress(body)
    # skip rect
    nbits = body[0] >> 3
    rectbytes = (5 + nbits*4 + 7)//8
    pos = rectbytes + 4  # rect + framerate(2) + framecount(2)
    frame_rate = body[rectbytes] / 256 + body[rectbytes+1]
    frames = struct.unpack_from('<H', body, rectbytes+2)[0]
    tags = []
    while pos < len(body):
        code_len = struct.unpack_from('<H', body, pos)[0]; pos += 2
        code, length = code_len >> 6, code_len & 0x3F
        if length == 0x3F:
            length = struct.unpack_from('<I', body, pos)[0]; pos += 4
        tags.append((code, body[pos:pos+length]))
        pos += length
        if code == 0: break
    return frame_rate, frames, tags

def scan(path):
    fr, frames, tags = read_swf(path)
    counts = {}
    sounds = []
    exports = []
    action_bytes = 0
    stream = None
    for code, payload in tags:
        name = TAGS.get(code, f'tag{code}')
        counts[name] = counts.get(name,0)+1
        if code == 14:
            sid, flags = struct.unpack_from('<HB', payload, 0)
            fmt = FORMATS.get(flags>>4, flags>>4)
            rate = RATES[(flags>>2)&3]
            stereo = flags&1
            samples = struct.unpack_from('<I', payload, 3)[0]
            sounds.append((sid, fmt, rate, 'st' if stereo else 'mo', samples, len(payload)))
        if code in (18,45):
            flags2 = payload[1]
            fmt = FORMATS.get(flags2>>4, flags2>>4)
            stream = fmt
        if code in (12,59):
            action_bytes += len(payload)
        if code == 56:
            n = struct.unpack_from('<H', payload, 0)[0]
            p = 2
            for _ in range(n):
                cid = struct.unpack_from('<H', payload, p)[0]; p+=2
                end = payload.index(b'\0', p)
                exports.append((cid, payload[p:end].decode('latin1'))); p = end+1
    print(f'== {os.path.basename(path)}  fps={fr:.1f} frames={frames}')
    print('   tags:', {k:v for k,v in sorted(counts.items())})
    print(f'   DefineSound count={len(sounds)} action_bytes={action_bytes} stream={stream}')
    if sounds:
        total = sum(s[5] for s in sounds)
        print(f'   sounds total={total}B first={sounds[0]} last={sounds[-1]}')
    if exports:
        print(f'   exports({len(exports)}):', exports[:8], '...' if len(exports)>8 else '')

for f in sorted(glob.glob(sys.argv[1] + '/*.swf')):
    try: scan(f)
    except Exception as e: print(f'== {os.path.basename(f)} ERROR {e}')
