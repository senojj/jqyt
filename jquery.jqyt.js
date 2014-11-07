/* jquery.jqyt - v1.0.0 - 2014-11-06
 * https://github.com/joshua-jones-software/jqyt
 * Copyright (c) 2014 Joshua Jones; Licensed MIT
 */

;
( function ( $ ) {
    $.fn.jqyt = function ( options ) {
        var opts = null,
            playerCtr = 0;

        if ( typeof options === 'string' ) {
            return this.each( function () {
                var self = $( this );

                if ( options === 'destroy' ) {
                    self.data( 'jqyt-player' ).destroy();
                    self.data( 'jqyt-player', null );
                    $( '#' + self.data( 'jqyt-player-id' ) ).remove();
                    self.data( 'jqyt-player-id', null )
                        .off( 'jqytPlayerEnded' )
                        .off( 'jqytPlayerPlaying' )
                        .off( 'jqytPlayerPaused' )
                        .off( 'jqytPlayerBuffering' )
                        .off( 'jqytPlayerQueued' )
                        .off( 'jqytPlayerStateChanged' )
                        .off( 'jqytPlayerProgress' )
                        .off( 'jqytPlayerCreated' )
                        .off( 'jqytPlayerReady' );
                }
            } );
        }

        opts = $.extend( true, { }, $.fn.jqyt.defaults, options );

        if ( !$.fn.jqyt.ready ) {
            $.fn.jqyt.queue.push( { selector: $( this ), o: opts } );
            opts.events.jqytPlayerNotReady.call( this );
            return this;
        }

        return this.filter( 'div' ).each( function () {
            var self = $( this ),
                o = $.extend( true, { }, opts ),
                p = null,
                value = null,
                loopInterval = null,
                obj = null,
                player = null;

            for ( p in o ) {

                if ( typeof o[p] !== 'function' && self.data( 'jqyt-options-' + p ) !== undefined ) {
                    value = self.data( 'jqyt-options-' + p );

                    if ( typeof o[p] !== 'object' ) {
                        o[p] = value;
                    }
                    else {
                        o[p] = $.extend( true, { }, o[p], value );
                    }
                }
            }

            while ( $( '#jqyt-video-' + playerCtr ).length ) {
                playerCtr++;
            }

            obj = $( '<div />' ).attr( 'id', 'jqyt-video-' + playerCtr ).appendTo( self );
            playerCtr++;

            self.on( 'jqytPlayerEnded', o.events.jqytPlayerEnded )
                .on( 'jqytPlayerPlaying', o.events.jqytPlayerPlaying )
                .on( 'jqytPlayerPaused', o.events.jqytPlayerPaused )
                .on( 'jqytPlayerBuffering', o.events.jqytPlayerBuffering )
                .on( 'jqytPlayerQueued', o.events.jqytPlayerQueued )
                .on( 'jqytPlayerStateChanged', o.events.jqytPlayerStateChanged )
                .on( 'jqytPlayerProgress', o.events.jqytPlayerProgress )
                .on( 'jqytPlayerCreated', o.events.jqytPlayerCreated )
                .on( 'jqytPlayerReady', o.events.jqytPlayerReady );

            self.data( 'jqyt-player-id', obj.attr( 'id' ) );

            self.on( 'jqytPlayerStateChanged', function ( e, state ) {
                var states = { };

                states[YT.PlayerState.ENDED] = function () {

                    if ( loopInterval !== null ) {
                        clearInterval( loopInterval );
                    }
                    self.trigger( 'jqytPlayerEnded', [state.target] );

                };
                states[YT.PlayerState.PLAYING] = function () {

                    if ( loopInterval !== null ) {
                        clearInterval( loopInterval );
                    }
                    loopInterval = setInterval( function () {
                        self.trigger( 'jqytPlayerProgress', [state.target] );
                    }, o.progressInterval );
                    self.trigger( 'jqytPlayerPlaying', [state.target] );
                };
                states[YT.PlayerState.PAUSED] = function () {

                    if ( loopInterval !== null ) {
                        clearInterval( loopInterval );
                    }
                    self.trigger( 'jqytPlayerPaused', [state.target] );
                };
                states[YT.PlayerState.BUFFERING] = function () {

                    if ( loopInterval !== null ) {
                        clearInterval( loopInterval );
                    }
                    self.trigger( 'jqytPlayerBuffering', [state.target] );
                };
                states[YT.PlayerState.CUED] = function () {

                    if ( loopInterval !== null ) {
                        clearInterval( loopInterval );
                    }
                    self.trigger( 'jqytPlayerQueued', [state.target] );
                };

                if ( states[state.data] ) {
                    states[state.data]();
                }
            } );

            player = new YT.Player( obj.attr( 'id' ), {
                height: self.height(),
                width: self.width(),
                videoId: o.videoId,
                playerVars: o.playerVars,
                events: {
                    onReady: function ( e ) {
                        self.trigger( 'jqytPlayerReady', [e.target] );
                    },
                    onStateChange: function ( state ) {
                        self.trigger( 'jqytPlayerStateChanged', [state] );
                    },
                    onError: function ( e ) {
                        self.trigger( 'jqytPlayerError', [e.target] );
                    }
                }
            } );

            self.find( 'iframe' ).css( 'visibility', 'hidden' );

            if ( o.infoRequest ) {
                $.ajax( {
                    url: 'http://gdata.youtube.com/feeds/api/videos/' + o.videoId + '?v=2&alt=jsonc',
                    context: self,
                    async: false,
                    dataType: 'jsonp',
                    success: function ( data ) {
                        player.video = data.data;
                        this.data( 'jqyt-player', player );
                        this.find( 'iframe' ).css( 'visibility', 'visible' );
                        self.trigger( 'jqytPlayerCreated', [player] );
                    }
                } );
            }
            else {
                self.data( 'jqyt-player', player );
                self.find( 'iframe' ).css( 'visibility', 'visible' );
                self.trigger( 'jqytPlayerCreated', [player] );
            }
        } );
    };

    $.fn.jqyt.ready = false;

    $.fn.jqyt.defaults = {
        videoId: '',
        playerVars: {
            wmode: 'opaque',
            autoplay: 0,
            controls: 1
        },
        progressInterval: 100,
        infoRequest: false,
        events: {
            jqytPlayerNotReady: function () {
            },
            jqytPlayerCreated: function () {
            },
            jqytPlayerReady: function () {
            },
            jqytPlayerStateChanged: function () {
            },
            jqytPlayerEnded: function () {
            },
            jqytPlayerPlaying: function () {
            },
            jqytPlayerPaused: function () {
            },
            jqytPlayerBuffering: function () {
            },
            jqytPlayerQueued: function () {
            },
            jqytPlayerError: function () {
            },
            jqytPlayerProgress: function () {
            }
        }
    };

    $.fn.jqyt.queue = [];

    if ( !window.YT ) {
        var tag = document.createElement( 'script' );
        tag.src = "http://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName( 'script' )[0];
        firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
    }

    window.onYouTubeIframeAPIReady = ( function () {
        var cachedFunction = window.onYouTubeIframeAPIReady;

        return function () {
            $.fn.jqyt.ready = true;
            var i;

            for ( i = 0; i < $.fn.jqyt.queue.length; i++ ) {
                $.fn.jqyt.queue[i].selector.jqyt( $.fn.jqyt.queue[i].o );
            }
            $.fn.jqyt.queue = [];

            if ( cachedFunction !== undefined ) {
                cachedFunction.apply( this, arguments );
            }
        };
    }() );
}( jQuery ) );