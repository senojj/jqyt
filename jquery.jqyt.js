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
                    self.data('jqyt-player').destroy();
                    self.data('jqyt-player', null);
                    $('#' + self.data('jqyt-player-id')).remove();
                    self.data('jqyt-player-id', null)
                        .off('jqyt_player_end')
                        .off('jqyt_player_playing')
                        .off('jqyt_player_paused')
                        .off('jqyt_player_buffering')
                        .off('jqyt_player_queued')
                        .off('jqyt_player_state_changed')
                        .off('jqyt_player_progress')
                        .off('jqyt_player_created')
                        .off('jqyt_player_ready');
                }
            });
        }

        opts = $.extend(true, {}, $.YTiFrame.defaults, options);

        if (!$.YTiFrame.ready) {
            $.YTiFrame.queue.push({ selector: $(this), o: opts });
            opts.events.jqyt_player_not_ready.call(this);
            return this;
        }

        return this.filter('div').each(function () {
            var self                = $(this),
                o                   = $.extend(true, {}, opts),
                p                   = null,
                value               = null,
                loop_interval       = null,
                obj                 = null,
                player              = null;

            for (p in o) {

                if (typeof o[p] !== 'function' && self.data('jqyt-options-' + p) !== undefined) {
                    value = self.data('jqyt-options-' + p);

                    if (typeof o[p] !== 'object') {
                        o[p] = value;
                    }
                    else {
                        o[p] = $.extend(true, {}, o[p], value);
                    }
                }
            }

            while ($('#jqyt-video-' + player_ctr).length) {
                player_ctr++;
            }

            obj = $('<div />').attr('id', 'jqyt-video-' + player_ctr).appendTo(self);
            player_ctr++;

            self.on('jqyt_player_end', o.events.jqyt_player_end)
                .on('jqyt_player_playing', o.events.jqyt_player_playing)
                .on('jqyt_player_paused', o.events.jqyt_player_paused)
                .on('jqyt_player_buffering', o.events.jqyt_player_buffering)
                .on('jqyt_player_queued', o.events.jqyt_player_queued)
                .on('jqyt_player_state_changed', o.events.jqyt_player_state_changed)
                .on('jqyt_player_progress', o.events.jqyt_player_progress)
                .on('jqyt_player_created', o.events.jqyt_player_created)
                .on('jqyt_player_ready', o.events.jqyt_player_ready);

            self.data('jqyt-player-id', obj.attr('id'));

            self.on('jqyt_player_state_changed', function (e, state) {
                var states = {};
                
                states[YT.PlayerState.ENDED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('jqyt_player_end', [state.target]);

                };
                states[YT.PlayerState.PLAYING] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    loop_interval = setInterval(function() {
                        self.trigger('jqyt_player_progress', [state.target]);
                    }, o.progress_interval);
                    self.trigger('jqyt_player_playing', [state.target]);
                };
                states[YT.PlayerState.PAUSED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('jqyt_player_paused', [state.target]);
                };
                states[YT.PlayerState.BUFFERING] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('jqyt_player_buffering', [state.target]);
                };
                states[YT.PlayerState.CUED] = function() {

                    if (loop_interval !== null) {
                        clearInterval(loop_interval);
                    }
                    self.trigger('jqyt_player_queued', [state.target]);
                };

                if (states[state.data]) {
                    states[state.data]();
                }
            });
            
            player = new YT.Player(obj.attr('id'), {
                height:     self.height(),
                width:      self.width(),
                videoId:    o.video_id,
                playerVars: o.player_vars,
                events: {
                    onReady: function(e) {
                        self.trigger('jqyt_player_ready', [e.target]);
                    },
                    onStateChange: function(state) {
                        self.trigger('jqyt_player_state_changed', [state]);
                    },
                    onError: function(e) {
                        self.trigger('jqyt_player_error', [e.target]);
                    }
                }
            });

            self.find('iframe').css('visibility', 'hidden');

            if (o.info_request) {
                $.ajax({
                    url:        'http://gdata.youtube.com/feeds/api/videos/' + o.video_id + '?v=2&alt=jsonc',
                    context:    self,
                    async:      false,
                    dataType:   'jsonp',
                    success: function(data) {
                        player.video = data.data;
                        this.data('jqyt-player', player);
                        this.find('iframe').css('visibility', 'visible');
                        self.trigger('jqyt_player_created', [player]);
                    }
                });
            }
            else {
                self.data('jqyt-player', player);
                self.find('iframe').css('visibility', 'visible');
                self.trigger('jqyt_player_created', [player]);
            }
        });
    };

    $.YTiFrame = {};

    $.YTiFrame.ready = false;

    $.YTiFrame.defaults = {
        video_id: '',
        player_vars: {
            wmode:      'opaque',
            autoplay:   0,
            controls:   1
        },
        progress_interval: 100,
        info_request: false,
        events: {
            jqyt_player_not_ready:      function() {},
            jqyt_player_created:        function() {},
            jqyt_player_ready:          function() {},
            jqyt_player_state_changed:  function() {},
            jqyt_player_end:            function() {},
            jqyt_player_playing:        function() {},
            jqyt_player_paused:         function() {},
            jqyt_player_buffering:      function() {},
            jqyt_player_queued:         function() {},
            jqyt_player_error:          function() {},
            jqyt_player_progress:       function() {}
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