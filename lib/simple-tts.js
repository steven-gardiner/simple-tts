/*jshint node:true, eqeqeq:true, undef:true, curly:true, laxbreak:true, forin:true, smarttabs:true */
/*global */



(function() {
    
    'use strict';
    
    

    var spawn = require('child_process').spawn,
        fs    = require('fs');


    /**
     * @module node_API
     */

    /**
     * @function speak
     *
     * @param {String}    text              text to speak
     *
     * @param {Object}    o
     * @param {String}   [o.lang='en']      language to use. ex: en, fr, es, pt...
     * @param {String}   [o.format='mp3']   format. can be either mp3 or ogg.
     *
     * @param {Number}   [o.amplitude=200]  espeak parameter. amplitude ~ volume.
     * @param {Number}   [o.pitch=40]       espeak parameter. voice pitch.
     * @param {Number}   [o.speed=150]      espeak parameter. narration speed.
     * @param {Number}   [o.wordgap=3]      espeak parameter. time between words.
     *
     * @param {String}   [o.filename]       filename of file to save the rendering to (mutually exclusive with stream)
     * @param {Stream}   [o.stream]         stream where to write the rendering to (mutually exclusive with filename)
     */
    var speak = function(text, o) {
	if (!o) { o = {}; }
        if (!('lang'   in o)) { o.lang   = 'en'; }
        if (!('format' in o)) { o.format = 'mp3'; }

        if (!('amplitude' in o)) { o.amplitude = 200; } else { o.amplitude = parseInt(o.amplitude, 10); }
        if (!('pitch'     in o)) { o.pitch     =  40; } else { o.pitch     = parseInt(o.pitch,     10); }
        if (!('speed'     in o)) { o.speed     = 150; } else { o.speed     = parseInt(o.speed,     10); }
        if (!('wordgap'   in o)) { o.wordgap   =   3; } else { o.wordgap   = parseInt(o.wordgap,   10); }

        o.converter = (o.format === 'ogg') ? 'oggenc' : 'lame';

        if ('stream' in o) {
        }
        else if ('filename' in o) {
            o.stream = fs.createWriteStream(o.filename + '.' + o.format, {encoding:'binary'});
        }
        else {
	    o.converter = null;
	    o.stream = spawn('aplay', []).stdin;
            //throw 'either stream or filename must be passed in!';
        }


        text = text.replace(/\!/g, '\\!');
        text = text.replace(/'/g, '\\');
        
        var cmd1 = [
            'echo', '-e', ''+text+'',
            '|',
            'espeak',
            '--stdin',
            '--stdout',
            '-v', o.lang,
            '-a', o.amplitude,
            '-p', o.pitch,
            '-s', o.speed,
            '-g', o.wordgap,
	];


        //console.log(cmd);

        var child1 = spawn('bash', ['-c', cmd1.join(" ")], {cwd:__dirname});

	if (o.converter) {
	    var cmd2 = [            
		o.converter,
		'--quiet',
		'-b', 16, // bit rate
            ];
            if (o.format === 'mp3') {
		cmd2 = cmd2.concat([
                    '-h', // quality
                    //'-m', 'm', // mono
		]);
            }
            else {
		cmd2 = cmd2.concat([
                    '-q', -1, // quality
                    //'--downmix', // mono
		]);
            }
            cmd2.push('-');
            var child2 = spawn('bash', ['-c', cmd2.join(" ")], {cwd:__dirname});
            child1.stdout.pipe(child2.stdin);
	    child2.stdout.pipe(o.stream);
	} else {
            child1.stdout.pipe(o.stream);
	}
        
        child1.stderr.on('data', function(data) {
            if (o.cb) {
                return o.cb(data);
            }
            else {
                throw data;
            }
        });
        
        child1.on('exit', function(code) {
            o.stream.end();
            if ('cb' in o) {
                if (code !== 0) {
                    return o.cb('Process returned error code=' + code);
                }
                o.cb(null);
            }
        });
        
    };

    var listen = function(emitter) {
	if (emitter.listeners(speak).length > 0) { return; }
	emitter.on('speak', function(spec) {
	    if (spec.text.join) {
		spec.text = spec.text.join(" ");
	    }
	    speak(spec.text, spec);
	});
    };
    
    var simple_tts = module.exports = {speak:speak,listen:listen};

    if (! module.parent) {
	simple_tts.listen(process);
	process.emit('speak', {text:process.argv.slice(2).join(" ")});
    }
    
})();

