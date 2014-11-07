jqyt
====

jQuery plug-in for the YouTube iFrame API

####Basic Example

HTML
```xhtml
<div class="video" style="width:500px;height:300px;"></div>
```

JavaScript
```javascript
$( '.video' ).jqyt( { videoId: 'bHQqvYy5KYo' } );
```

####Basic Example : Multiple Videos

HTML
```xhtml
<div class="video" data-jqyt-video-id="bHQqvYy5KYo" style="width:500px;height:300px;"></div>
<div class="video" data-jqyt-video-id="EgeMgjplANY" style="width:500px;height:300px;"></div>
```

JavaScript
```javascript
$( '.video' ).jqyt();
```
