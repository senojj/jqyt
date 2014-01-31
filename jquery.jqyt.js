/* jquery.jqyt - v1.0 - 2014-01-31
 * https://github.com/joshua-jones-software/jqyt
 * Copyright (c) 2014 Joshua Jones; Licensed MIT 
 */
;(function($) {
    $.fn.YTiFrame = function(options) {
        var opts        = null,
            player_ctr  = 0;

        if (typeof options === 'string') {
            return this.each(function() {
                var self = $(this);

                if (options === 'destroy') {
                    self.data('yti-player').destroy();
                    self.data('yti-player', null);
                    $('#' + self.data('yti-player-id')).remove();
                    self.data('yti-player-id', null);
                    self.off('onPlayerEnd');
                    self.off('onPlayerPlaying');
                    self.off('onPlayerPaused');
                    self.off('onPlayerBuffering');
                    self.off('onPlayerCued');
                    self.off('onPlayerStateChange');
                    self.off('onPlayerProgress');
                    self.off('onPlayerCreated');
                    self.off('onPlayerReady');
                }
            });
        }

        opts = $.extend(true, {}, $.YTiFrame.defaults, options);

        if (!$.YTiFrame.ready) {
            $.YTiFrame.queue.push({ selector: $(this), o: opts });
            opts.events.onPlayerNotReady.call(this);
            return this;
        }

        return this.filter('div').each(function () {
            var self                = $(this),
                context             = this,
                o                   = $.extend(true, {}, opts),
                p                   = null,
                value               = null,
                loop_interval       = null
                obj                 = null,
                player              = null;

            for (p in o) {
            
                if (typeof o[p] !== 'function' && self.data('yti-options-' + p) !== undefined) {
                    value = self.data('yti-options-' + p);
                    
                    if (typeof o[p] !== 'object') {
                        o[p] = value;
                    }
                    else {
                        o[p] = $.extend(true, {}, o[p], value);
                    }
                }
            }
            
            while ($('#yti-video-' + player_ctr).length) {
                player_ctr++;
            }
            
            obj = $('<div />').attr('id', 'yti-video-' + player_ctr).appendTo(self);
            player_ctr++;
            
            self.on('onPlayerEnd', o.events.onPlayerEnd);
            self.on('onPlayerPlaying', o.events.onPlayerPlaying);
            self.on('onPlayerPaused', o.events.onPlayerPaused);
            self.on('onPlayerBuffering', o.events.onPlayerBuffering);
            self.on('onPlayerCued', o.events.onPlayerCued);
            self.on('onPlayerStateChange', o.events.onPlayerStateChange);
            self.on('onPlayerProgress', o.events.onPlayerProgress);
            self.on('onPlayerCreated', o.events.onPlayerCreated);
			self.on('onPlayerReady', o.events.onPlayerReady);

            self.data('yti-player-id', obj.attr('id'));

            self.on('onPlayerStateChange', function (e, state) {
                var states = {};
                states[YT.PlayerState.ENDED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('onPlayerEnd', [state.target]);
                    
                };
                states[YT.PlayerState.PLAYING] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    loop_interval = setInterval(function() {
                        self.trigger('onPlayerProgress', [state.target]);
                    }, o.progress_interval);
                    self.trigger('onPlayerPlaying', [state.target]);
                };
                states[YT.PlayerState.PAUSED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('onPlayerPaused', [state.target]);
                };
                states[YT.PlayerState.BUFFERING] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('onPlayerBuffering', [state.target]);
                };
                states[YT.PlayerState.CUED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('onPlayerCued', [state.target]);
                };

                if (states[state.data]) {
                    states[state.data]();
                }
            });
            
            player = new YT.Player(obj.attr('id'), {
                height: self.height(),
                width: self.width(),
                videoId: o.video_id,
                playerVars: o.player_vars,
                events: {
                    onReady: function(e) {
                        self.trigger('onPlayerReady', [e.target]);
                    },
                    onStateChange: function(state) {
                        self.trigger('onPlayerStateChange', [state]);
                    },
                    onError: function(e) {
                        self.trigger('onPlayerError', [e.target]);
                    }
                }
            });

            self.find('iframe').css('visibility', 'hidden');

            if (o.info_request) {
                $.ajax({
                    url: 'http://gdata.youtube.com/feeds/api/videos/' + o.video_id + '?v=2&alt=jsonc',
                    context: self,
                    async: false,
                    dataType: 'jsonp',
                    success: function(data) {
                        player.video = data.data;
                        this.data('yti-player', player);
                        this.find('iframe').css('visibility', 'visible');
						self.trigger('onPlayerCreated', [player]);
                    }
                });
            }
            else {
                self.data('yti-player', player);
                self.find('iframe').css('visibility', 'visible');
                self.trigger('onPlayerCreated', [player]);
            }
        });
    };
    
    $.YTiFrame = {};

    $.YTiFrame.ready = false;

    $.YTiFrame.defaults = {
        video_id: '',
        player_vars: {
            wmode: 'opaque', 
            autoplay: 0, 
            controls: 1 
		},
        progress_interval: 100,
        info_request: false,
        events: {
            onPlayerNotReady: function() {},
            onPlayerCreated: function() {},
            onPlayerReady: function() {},
            onPlayerStateChange: function() {},
            onPlayerEnd: function() {},
            onPlayerPlaying: function() {},
            onPlayerPaused: function() {},
            onPlayerBuffering: function() {},
            onPlayerCued: function() {},
            onPlayerError: function() {},
            onPlayerProgress: function() {}
        }
    };

    $.YTiFrame.queue = [];

    if (!window.YT) {
        var tag = document.createElement('script');
        tag.src = "http://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = (function() {
        var cached_function = window.onYouTubeIframeAPIReady;
        return function() {
            $.YTiFrame.ready = true;
            var i;
            for (i = 0; i < $.YTiFrame.queue.length; i++) {
                $.YTiFrame.queue[i].selector.YTiFrame($.YTiFrame.queue[i].o);
            }
            $.YTiFrame.queue = [];
            if (cached_function !== undefined) {
                cached_function.apply(this, arguments);
            }
        };
    }());
}(jQuery));
