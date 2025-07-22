(function () {
	'use strict';

	( () => {

	  let uniqueID = 0;

	  class AnimationEngine {

	    constructor() {

	      this.ids = [];
	      this.animations = {};
	      this.update = this.update.bind( this );
	      this.raf = 0;
	      this.time = 0;

	    }

	    update() {

	      const now = performance.now();
	      const delta = now - this.time;
	      this.time = now;

	      let i = this.ids.length;

	      this.raf = i ? requestAnimationFrame( this.update ) : 0;

	      while ( i-- )
	        this.animations[ this.ids[ i ] ] && this.animations[ this.ids[ i ] ].update( delta );

	    }

	    add( animation ) {

	      animation.id = uniqueID ++;

	      this.ids.push( animation.id );
	      this.animations[ animation.id ] = animation;

	      if ( this.raf !== 0 ) return;

	      this.time = performance.now();
	      this.raf = requestAnimationFrame( this.update );

	    }

	    remove( animation ) {

	      const index = this.ids.indexOf( animation.id );

	      if ( index < 0 ) return;

	      this.ids.splice( index, 1 );
	      delete this.animations[ animation.id ];
	      animation = null;

	    }

	  }

	  return new AnimationEngine();

	} )();

	function RoundedBoxGeometry( size, radius, radiusSegments ) {

	  THREE.BufferGeometry.call( this );

	  this.type = 'RoundedBoxGeometry';

	  radiusSegments = ! isNaN( radiusSegments ) ? Math.max( 1, Math.floor( radiusSegments ) ) : 1;

	  var width, height, depth;

	  width = height = depth = size;
	  radius = size * radius;

	  radius = Math.min( radius, Math.min( width, Math.min( height, Math.min( depth ) ) ) / 2 );

	  var edgeHalfWidth = width / 2 - radius;
	  var edgeHalfHeight = height / 2 - radius;
	  var edgeHalfDepth = depth / 2 - radius;

	  this.parameters = {
	    width: width,
	    height: height,
	    depth: depth,
	    radius: radius,
	    radiusSegments: radiusSegments
	  };

	  var rs1 = radiusSegments + 1;
	  var totalVertexCount = ( rs1 * radiusSegments + 1 ) << 3;

	  var positions = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );
	  var normals = new THREE.BufferAttribute( new Float32Array( totalVertexCount * 3 ), 3 );

	  var cornerVerts = [],
	    cornerNormals = [];
	    new THREE.Vector3();
	    var vertex = new THREE.Vector3(),
	    vertexPool = [],
	    normalPool = [],
	    indices = []
	  ;

	  var
	    lastVertex = rs1 * radiusSegments,
	    cornerVertNumber = rs1 * radiusSegments + 1
	  ;

	  doVertices();
	  doFaces();
	  doCorners();
	  doHeightEdges();
	  doWidthEdges();
	  doDepthEdges();

	  function doVertices() {

	    var cornerLayout = [
	      new THREE.Vector3( 1, 1, 1 ),
	      new THREE.Vector3( 1, 1, -1 ),
	      new THREE.Vector3( -1, 1, -1 ),
	      new THREE.Vector3( -1, 1, 1 ),
	      new THREE.Vector3( 1, -1, 1 ),
	      new THREE.Vector3( 1, -1, -1 ),
	      new THREE.Vector3( -1, -1, -1 ),
	      new THREE.Vector3( -1, -1, 1 )
	    ];

	    for ( var j = 0; j < 8; j ++ ) {

	      cornerVerts.push( [] );
	      cornerNormals.push( [] );

	    }

	    var PIhalf = Math.PI / 2;
	    var cornerOffset = new THREE.Vector3( edgeHalfWidth, edgeHalfHeight, edgeHalfDepth );

	    for ( var y = 0; y <= radiusSegments; y ++ ) {

	      var v = y / radiusSegments;
	      var va = v * PIhalf;
	      var cosVa = Math.cos( va );
	      var sinVa = Math.sin( va );

	      if ( y == radiusSegments ) {

	        vertex.set( 0, 1, 0 );
	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );
	        var norm = vertex.clone();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );
	        continue;

	      }

	      for ( var x = 0; x <= radiusSegments; x ++ ) {

	        var u = x / radiusSegments;
	        var ha = u * PIhalf;
	        vertex.x = cosVa * Math.cos( ha );
	        vertex.y = sinVa;
	        vertex.z = cosVa * Math.sin( ha );

	        var vert = vertex.clone().multiplyScalar( radius ).add( cornerOffset );
	        cornerVerts[ 0 ].push( vert );
	        vertexPool.push( vert );

	        var norm = vertex.clone().normalize();
	        cornerNormals[ 0 ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	    for ( var i = 1; i < 8; i ++ ) {

	      for ( var j = 0; j < cornerVerts[ 0 ].length; j ++ ) {

	        var vert = cornerVerts[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerVerts[ i ].push( vert );
	        vertexPool.push( vert );

	        var norm = cornerNormals[ 0 ][ j ].clone().multiply( cornerLayout[ i ] );
	        cornerNormals[ i ].push( norm );
	        normalPool.push( norm );

	      }

	    }

	  }

	  function doCorners() {

	    var flips = [
	      true,
	      false,
	      true,
	      false,
	      false,
	      true,
	      false,
	      true
	    ];

	    var lastRowOffset = rs1 * ( radiusSegments - 1 );

	    for ( var i = 0; i < 8; i ++ ) {

	      var cornerOffset = cornerVertNumber * i;

	      for ( var v = 0; v < radiusSegments - 1; v ++ ) {

	        var r1 = v * rs1;
	        var r2 = ( v + 1 ) * rs1;

	        for ( var u = 0; u < radiusSegments; u ++ ) {

	          var u1 = u + 1;
	          var a = cornerOffset + r1 + u;
	          var b = cornerOffset + r1 + u1;
	          var c = cornerOffset + r2 + u;
	          var d = cornerOffset + r2 + u1;

	          if ( ! flips[ i ] ) {

	            indices.push( a );
	            indices.push( b );
	            indices.push( c );

	            indices.push( b );
	            indices.push( d );
	            indices.push( c );

	          } else {

	            indices.push( a );
	            indices.push( c );
	            indices.push( b );

	            indices.push( b );
	            indices.push( c );
	            indices.push( d );

	          }

	        }

	      }

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var a = cornerOffset + lastRowOffset + u;
	        var b = cornerOffset + lastRowOffset + u + 1;
	        var c = cornerOffset + lastVertex;

	        if ( ! flips[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );

	        }

	      }

	    }

	  }

	  function doFaces() {

	    var a = lastVertex;
	    var b = lastVertex + cornerVertNumber;
	    var c = lastVertex + cornerVertNumber * 2;
	    var d = lastVertex + cornerVertNumber * 3;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( a );
	    indices.push( c );
	    indices.push( d );

	    a = lastVertex + cornerVertNumber * 4;
	    b = lastVertex + cornerVertNumber * 5;
	    c = lastVertex + cornerVertNumber * 6;
	    d = lastVertex + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( a );
	    indices.push( d );
	    indices.push( c );

	    a = 0;
	    b = cornerVertNumber;
	    c = cornerVertNumber * 4;
	    d = cornerVertNumber * 5;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = cornerVertNumber * 2;
	    b = cornerVertNumber * 3;
	    c = cornerVertNumber * 6;
	    d = cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	    a = radiusSegments;
	    b = radiusSegments + cornerVertNumber * 3;
	    c = radiusSegments + cornerVertNumber * 4;
	    d = radiusSegments + cornerVertNumber * 7;

	    indices.push( a );
	    indices.push( b );
	    indices.push( c );
	    indices.push( b );
	    indices.push( d );
	    indices.push( c );

	    a = radiusSegments + cornerVertNumber;
	    b = radiusSegments + cornerVertNumber * 2;
	    c = radiusSegments + cornerVertNumber * 5;
	    d = radiusSegments + cornerVertNumber * 6;

	    indices.push( a );
	    indices.push( c );
	    indices.push( b );
	    indices.push( b );
	    indices.push( c );
	    indices.push( d );

	  }

	  function doHeightEdges() {

	    for ( var i = 0; i < 4; i ++ ) {

	      var cOffset = i * cornerVertNumber;
	      var cRowOffset = 4 * cornerVertNumber + cOffset;
	      var needsFlip = i & 1 === 1;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var u1 = u + 1;
	        var a = cOffset + u;
	        var b = cOffset + u1;
	        var c = cRowOffset + u;
	        var d = cRowOffset + u1;

	        if ( ! needsFlip ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  function doDepthEdges() {

	    var cStarts = [ 0, 2, 4, 6 ];
	    var cEnds = [ 1, 3, 5, 7 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cornerVertNumber * cStarts[ i ];
	      var cEnd = cornerVertNumber * cEnds[ i ];

	      var needsFlip = 1 >= i;

	      for ( var u = 0; u < radiusSegments; u ++ ) {

	        var urs1 = u * rs1;
	        var u1rs1 = ( u + 1 ) * rs1;

	        var a = cStart + urs1;
	        var b = cStart + u1rs1;
	        var c = cEnd + urs1;
	        var d = cEnd + u1rs1;

	        if ( needsFlip ) {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        } else {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        }

	      }

	    }

	  }

	  function doWidthEdges() {

	    var end = radiusSegments - 1;

	    var cStarts = [ 0, 1, 4, 5 ];
	    var cEnds = [ 3, 2, 7, 6 ];
	    var needsFlip = [ 0, 1, 1, 0 ];

	    for ( var i = 0; i < 4; i ++ ) {

	      var cStart = cStarts[ i ] * cornerVertNumber;
	      var cEnd = cEnds[ i ] * cornerVertNumber;

	      for ( var u = 0; u <= end; u ++ ) {

	        var a = cStart + radiusSegments + u * rs1;
	        var b = cStart + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        var c = cEnd + radiusSegments + u * rs1;
	        var d = cEnd + ( u != end ? radiusSegments + ( u + 1 ) * rs1 : cornerVertNumber - 1 );

	        if ( ! needsFlip[ i ] ) {

	          indices.push( a );
	          indices.push( b );
	          indices.push( c );
	          indices.push( b );
	          indices.push( d );
	          indices.push( c );

	        } else {

	          indices.push( a );
	          indices.push( c );
	          indices.push( b );
	          indices.push( b );
	          indices.push( c );
	          indices.push( d );

	        }

	      }

	    }

	  }

	  var index = 0;

	  for ( var i = 0; i < vertexPool.length; i ++ ) {

	    positions.setXYZ(
	      index,
	      vertexPool[ i ].x,
	      vertexPool[ i ].y,
	      vertexPool[ i ].z
	    );

	    normals.setXYZ(
	      index,
	      normalPool[ i ].x,
	      normalPool[ i ].y,
	      normalPool[ i ].z
	    );

	    index ++;

	  }

	  this.setIndex( new THREE.BufferAttribute( new Uint16Array( indices ), 1 ) );
	  this.addAttribute( 'position', positions );
	  this.addAttribute( 'normal', normals );

	}

	RoundedBoxGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
	RoundedBoxGeometry.constructor = RoundedBoxGeometry;

	window.addEventListener( 'touchmove', () => {} );
	document.addEventListener( 'touchmove',  event => { event.preventDefault(); }, { passive: false } );

	const RangeHTML = [

	  '<div class="range">',
	    '<div class="range__label"></div>',
	    '<div class="range__track">',
	      '<div class="range__track-line"></div>',
	      '<div class="range__handle"><div></div></div>',
	    '</div>',
	    '<div class="range__list"></div>',
	  '</div>',

	].join( '\n' );

	document.querySelectorAll( 'range' ).forEach( el => {

	  const temp = document.createElement( 'div' );
	  temp.innerHTML = RangeHTML;

	  const range = temp.querySelector( '.range' );
	  const rangeLabel = range.querySelector( '.range__label' );
	  const rangeList = range.querySelector( '.range__list' );

	  range.setAttribute( 'name', el.getAttribute( 'name' ) );
	  rangeLabel.innerHTML = el.getAttribute( 'title' );

	  if ( el.hasAttribute( 'color' ) ) {

	    range.classList.add( 'range--type-color' );
	    range.classList.add( 'range--color-' + el.getAttribute( 'name' ) );

	  }

	  if ( el.hasAttribute( 'list' ) ) {

	    el.getAttribute( 'list' ).split( ',' ).forEach( listItemText => {

	      const listItem = document.createElement( 'div' );
	      listItem.innerHTML = listItemText;
	      rangeList.appendChild( listItem );

	    } );

	  }

	  el.parentNode.replaceChild( range, el );

	} );

	const States = {
	  3: {
	    checkerboard: {
	      names: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 ],
	      positions: [
	        { "x": 2/3, "y": -1/3, "z": 1/3 },
	        { "x": -1/3, "y": 1/3, "z": 0 },
	        { "x": 1/3, "y": -1/3, "z": -1/3 },
	        { "x": -1/3, "y": 0, "z": -1/3 },
	        { "x": 1/3, "y": 0, "z": 0 },
	        { "x": -1/3, "y": 0, "z": 1/3 },
	        { "x": 1/3, "y": 1/3, "z": 1/3 },
	        { "x": -1/3, "y": -1/3, "z": 0 },
	        { "x": 1/3, "y": 1/3, "z": -1/3 },
	        { "x": 0, "y": 1/3, "z": -1/3 },
	        { "x": 0, "y": -1/3, "z": 0 },
	        { "x": 0, "y": 1/3, "z": 1/3 },
	        { "x": 0, "y": 0, "z": 1/3 },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": -1/3 },
	        { "x": 0, "y": -1/3, "z": -1/3 },
	        { "x": 0, "y": 1/3, "z": 0 },
	        { "x": 0, "y": -1/3, "z": 1/3 },
	        { "x": -1/3, "y": -1/3, "z": 1/3 },
	        { "x": 1/3, "y": 1/3, "z": 0 },
	        { "x": -1/3, "y": -1/3, "z": -1/3 },
	        { "x": 1/3, "y": 0, "z": -1/3 },
	        { "x": -1/3, "y": 0, "z": 0 },
	        { "x": 1/3, "y": 0, "z": 1/3 },
	        { "x": -1/3, "y": 1/3, "z": 1/3 },
	        { "x": 1/3, "y": -1/3, "z": 0 },
	        { "x": -1/3, "y": 1/3, "z": -1/3 }
	      ],
	      rotations: [
	        { "x": -Math.PI, "y": 0, "z": Math.PI, },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": -Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": 0, "y": 0, "z": Math.PI },
	        { "x": 0, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI },
	        { "x": -Math.PI, "y": 0, "z": 0 },
	        { "x": Math.PI, "y": 0, "z": Math.PI }
	      ],
	      size: 3,
	    },
	  }
	};

	class IconsConverter {

		constructor( options ) {

			options = Object.assign( {
				tagName: 'icon',
				className: 'icon',
				styles: false,
	      icons: {},
				observe: false,
				convert: false,
			}, options || {} );

			this.tagName = options.tagName;
			this.className = options.className;
			this.icons = options.icons;

			this.svgTag = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
			this.svgTag.setAttribute( 'class', this.className );

			if ( options.styles ) this.addStyles();
			if ( options.convert ) this.convertAllIcons();

			if ( options.observe ) {

				const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
				this.observer = new MutationObserver( mutations => { this.convertAllIcons(); } );
				this.observer.observe( document.documentElement, { childList: true, subtree: true } );

			}

			return this;

		}

		convertAllIcons() {

			document.querySelectorAll( this.tagName ).forEach( icon => { this.convertIcon( icon ); } );

		}

		convertIcon( icon ) {

			const svgData = this.icons[ icon.attributes[0].localName ];

			if ( typeof svgData === 'undefined' ) return;

			const svg = this.svgTag.cloneNode( true );
			const viewBox = svgData.viewbox.split( ' ' );

			svg.setAttributeNS( null, 'viewBox', svgData.viewbox );
			svg.style.width = viewBox[2] / viewBox[3] + 'em';
			svg.style.height = '1em';
			svg.innerHTML = svgData.content;

			icon.parentNode.replaceChild( svg, icon );

		}

		addStyles() {

			const style = document.createElement( 'style' );
	    style.innerHTML = `.${this.className} { display: inline-block; font-size: inherit; overflow: visible; vertical-align: -0.125em; preserveAspectRatio: none; }`;
			document.head.appendChild( style );

		}

	}

	new IconsConverter( {

	  icons: {
	    settings: {
	      viewbox: '0 0 512 512',
	      content: '<path fill="currentColor" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z" />',
	    },
	    back: {
	      viewbox: '0 0 512 512',
	      content: '<path transform="translate(512, 0) scale(-1,1)" fill="currentColor" d="M503.691 189.836L327.687 37.851C312.281 24.546 288 35.347 288 56.015v80.053C127.371 137.907 0 170.1 0 322.326c0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631C66.066 312.814 132.917 274.316 288 272.085V360c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z" />',
	    },
	    trophy: {
	      viewbox: '0 0 576 512',
	      content: '<path fill="currentColor" d="M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 66.5 77.9 131.7 171.9 142.4C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6C498.4 275.6 576 210.3 576 144V88c0-13.3-10.7-24-24-24zM64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-47.5-16.4-77-49.9-77-70.2zm448 0c0 20.2-29.4 53.8-77 70.2 7-25 11.8-53.6 12.8-86.2H512v16zm-127.3 4.7l-39.6 38.6 9.4 54.6c1.7 9.8-8.7 17.2-17.4 12.6l-49-25.8-49 25.8c-8.8 4.6-19.1-2.9-17.4-12.6l9.4-54.6-39.6-38.6c-7.1-6.9-3.2-19 6.7-20.5l54.8-8 24.5-49.6c4.4-8.9 17.1-8.9 21.5 0l24.5 49.6 54.8 8c9.6 1.5 13.5 13.6 6.4 20.5z" />',
	    },
	    cancel: {
	      viewbox: '0 0 352 512',
	      content: '<path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />',
	    },
	    theme: {
	      viewbox: '0 0 512 512',
	      content: '<path fill="currentColor" d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"/>',
	    },
	    reset: {
	      viewbox: '0 0 512 512',
	      content: '<path fill="currentColor" d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z" />',
	    },
	    trash: {
	      viewbox: '0 0 448 512',
	      content: '<path fill="currentColor" d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" />',
	    },
	  },

	  convert: true,

	} );

	const STATE = {
	  Menu: 0,
	  Playing: 1,
	  Complete: 2,
	  Stats: 3,
	  Prefs: 4,
	  Theme: 5,
	};

	const BUTTONS = {
	  Menu: [ 'stats', 'prefs' ],
	  Playing: [ 'back' ],
	  Complete: [],
	  Stats: [],
	  Prefs: [ 'back', 'theme' ],
	  Theme: [ 'back', 'reset' ],
	  None: [],
	};

	const SHOW = true;
	const HIDE = false;

	class Game {

	  constructor() {

	    const FACE_COLORS = {
	      U: "#fff7ff", // white (Top)
	      D: "#ffef48", // yellow (Bottom)
	      F: "#ef3923", // red (Front)
	      R: "#41aac8", // blue (Right)
	      B: "#ff8c0a", // orange (Back)
	      L: "#82ca38", // green (Left)
	    };

	    let selectedColor = null;
	    let currentFace = "F";
	    const cubeState = {
	      U: Array(9).fill("#555"),
	      D: Array(9).fill("#555"),
	      F: Array(9).fill("#555"),
	      B: Array(9).fill("#555"),
	      L: Array(9).fill("#555"),
	      R: Array(9).fill("#555"),
	    };

	    const adjacentFaces = {
	      F: { top: "U", bottom: "D", left: "L", right: "R" },
	      B: { top: "U", bottom: "D", left: "R", right: "L" },
	      L: { top: "U", bottom: "D", left: "B", right: "F" },
	      R: { top: "U", bottom: "D", left: "F", right: "B" },
	      U: { top: "B", bottom: "F", left: "L", right: "R" },
	      D: { top: "F", bottom: "B", left: "L", right: "R" }
	    };
	    const colorButtons = document.getElementById("colorButtons");
	    const face = document.getElementById("face");
	    const faceSelector = document.getElementById("faceSelector");
	    const printButton = document.getElementById("printButton");
	    const output = document.getElementById("output");

	    // Create color selector buttons
	    Object.entries(FACE_COLORS).forEach(([label, color],i) => {
	      const btn = document.createElement("button");
	      btn.title = label;
	      btn.style.backgroundColor = color;
	      btn.style.width = "30px";
	      btn.style.height = "30px";
	      btn.style.border = "2px solid white";
	      btn.style.marginRight = "5px";
	      btn.style.cursor = "pointer";

	      btn.addEventListener("click", () => {
	        selectedColor = color;
	        [...colorButtons.children].forEach(b => b.style.outline = "none");
	        btn.style.outline = "2px solid white";
	      });
	      cubeState[label][4] = color;

	      colorButtons.appendChild(btn);
	    });

	    // Create 9 cuboids (face tiles)
	    const cuboids = [];
	    for (let i = 0; i < 9; i++) {
	      const div = document.createElement("div");
	      div.style.width = "50px";
	      div.style.height = "50px";
	      div.style.backgroundColor = "#555";
	      div.style.cursor = "pointer";
	      div.style.border = "1px solid #999";
	      div.addEventListener("click", () => {
	        if(i==4){
	          event.preventDefault();
	          return;
	        }
	        if (selectedColor) {
	          div.style.backgroundColor = selectedColor;
	          cubeState[currentFace][i] = selectedColor;
	        }
	      });
	      cuboids.push(div);
	      face.appendChild(div);
	    }

	    // Face change logic with validation
	    faceSelector.addEventListener("change", (event) => {
	      const newFace = event.target.value;
	      const currentColors = cubeState[currentFace];
	      currentColors.every(color => color !== "#555");

	      // if (!isComplete) {
	      //   alert(`❗ Fill all 9 cuboids on the "${currentFace}" face before switching.`);
	      //   faceSelector.value = currentFace;
	      //   return;
	      // }

	      currentFace = newFace;
	      cubeState[currentFace].forEach((color, i) => {
	        cuboids[i].style.backgroundColor = color;
	      });
	      updateSurroundingFaces();
	    });

	    // Print/validate cube state
	    printButton.addEventListener("click", () => {
	      output.style.display = "block";

	      const allColors = Object.values(cubeState).flat();
	      const usedColors = new Set(allColors);
	      usedColors.delete("#555");

	      if (usedColors.size !== 6) {
	        output.textContent = `❌ Cube must use exactly 6 colors.\nUsed: ${[...usedColors].join(', ')}`;
	        return;
	      }

	      const colorCounts = {};
	      for (const color of allColors) {
	        if (color === "#555") continue;
	        colorCounts[color] = (colorCounts[color] || 0) + 1;
	      }

	      const overused = Object.entries(colorCounts).filter(([color, count]) => count > 9);
	      if (overused.length > 0) {
	        const msgs = overused.map(([color, count]) => `${color} used ${count} times`);
	        output.textContent = `❌ Each color can only appear up to 9 times.\n` + msgs.join('\n');
	        return;
	      }

	      output.textContent = `✅ Cube is valid!\n` + JSON.stringify(cubeState, null, 2);
	    });

	    // Initialize face with default face data
	    cubeState[currentFace].forEach((color, i) => {
	      console.log("color", color, currentFace);
	      cuboids[i].style.backgroundColor = color;
	    });

	    function createStrip(id) {
	      const container = document.getElementById(id);
	      console.log("container", id);
	      container.innerHTML = '';
	      for (let i = 0; i < 9; i++) {
	        console.log("i", i);
	        const tile = document.createElement("div");
	        tile.style.width = "30px";
	        tile.style.height = "30px";
	        tile.style.border = "1px solid #888";
	        tile.style.backgroundColor = "#222";
	        tile.style.display = "inline-block";
	        container.appendChild(tile);
	      }
	    }

	    function updateSurroundingFaces() {
	      console.log("updateSurroundingFaces");
	      const adj = adjacentFaces[currentFace];

	      function updateStrip(stripId, faceKey) {
	        const container = document.getElementById(stripId);
	        const tiles = container.children;
	        const colors = cubeState[faceKey];
	        console.log("colors", colors, faceKey, tiles);

	        for (let i = 0; i < 9; i++) {
	          tiles[i].style.backgroundColor = colors[i];
	          // if (!tiles[i]) continue;
	          // if (stripId === "adj-top") tiles[i].style.backgroundColor = colors[i];
	          // if (stripId === "adj-bottom") tiles[i].style.backgroundColor = colors[6 + i];
	          // if (stripId === "adj-left") tiles[i].style.backgroundColor = colors[i * 3];
	          // if (stripId === "adj-right") tiles[i].style.backgroundColor = colors[i * 3 + 2];
	        }
	      }

	      updateStrip("adj-top", adj.top);
	      updateStrip("adj-bottom", adj.bottom);
	      updateStrip("adj-left", adj.left);
	      updateStrip("adj-right", adj.right);
	    }

	    createStrip("adj-top");
	    createStrip("adj-bottom");
	    createStrip("adj-left");
	    createStrip("adj-right");
	    updateSurroundingFaces();



	    return;

	  }

	  initActions() {

	    let tappedTwice = false;

	    this.dom.game.addEventListener( 'click', event => {

	      if ( this.transition.activeTransitions > 0 ) return;
	      if ( this.state === STATE.Playing ) return;

	      if ( this.state === STATE.Menu ) {

	        if ( ! tappedTwice ) {

	          tappedTwice = true;
	          setTimeout( () => tappedTwice = false, 300 );
	          return false;

	        }

	        this.game( SHOW );

	      } else if ( this.state === STATE.Complete ) {

	        this.complete( HIDE );

	      } else if ( this.state === STATE.Stats ) {

	        this.stats( HIDE );

	      } 

	    }, false );

	    this.controls.onMove = () => {

	      if ( this.newGame ) {
	        
	        this.timer.start( true );
	        this.newGame = false;

	      }

	    };

	    this.dom.buttons.back.onclick = event => {

	      if ( this.transition.activeTransitions > 0 ) return;

	      if ( this.state === STATE.Playing ) {

	        this.game( HIDE );

	      } else if ( this.state === STATE.Prefs ) {

	        this.prefs( HIDE );

	      } else if ( this.state === STATE.Theme ) {

	        this.theme( HIDE );

	      }

	    };

	    this.dom.buttons.reset.onclick = event => {

	      if ( this.state === STATE.Theme ) {

	        this.themeEditor.resetTheme();

	      }
	      
	    };

	    this.dom.buttons.prefs.onclick = event => this.prefs( SHOW );

	    this.dom.buttons.theme.onclick = event => this.theme( SHOW );

	    this.dom.buttons.stats.onclick = event => this.stats( SHOW );

	    this.controls.onSolved = () => this.complete( SHOW );

	  }

	  game( show ) {

	    if ( show ) {

	      if ( ! this.saved ) {

	        this.scrambler.scramble();
	        this.controls.scrambleCube();
	        this.newGame = true;

	      }

	      const duration = this.saved ? 0 :
	        this.scrambler.converted.length * ( this.controls.flipSpeeds[0] + 10 );

	      this.state = STATE.Playing;
	      this.saved = true;

	      this.transition.buttons( BUTTONS.None, BUTTONS.Menu );

	      this.transition.zoom( STATE.Playing, duration );
	      this.transition.title( HIDE );

	      setTimeout( () => {

	        this.transition.timer( SHOW );
	        this.transition.buttons( BUTTONS.Playing, BUTTONS.None );

	      }, this.transition.durations.zoom - 1000 );

	      setTimeout( () => {

	        this.controls.enable();
	        if ( ! this.newGame ) this.timer.start( true );

	      }, this.transition.durations.zoom );

	    } else {

	      this.state = STATE.Menu;

	      this.transition.buttons( BUTTONS.Menu, BUTTONS.Playing );

	      this.transition.zoom( STATE.Menu, 0 );

	      this.controls.disable();
	      if ( ! this.newGame ) this.timer.stop();
	      this.transition.timer( HIDE );

	      setTimeout( () => this.transition.title( SHOW ), this.transition.durations.zoom - 1000 );

	      this.playing = false;
	      this.controls.disable();

	    }

	  }

	  prefs( show ) {

	    if ( show ) {

	      if ( this.transition.activeTransitions > 0 ) return;

	      this.state = STATE.Prefs;

	      this.transition.buttons( BUTTONS.Prefs, BUTTONS.Menu );

	      this.transition.title( HIDE );
	      this.transition.cube( HIDE );

	      setTimeout( () => this.transition.preferences( SHOW ), 1000 );

	    } else {

	      this.cube.resize();

	      this.state = STATE.Menu;

	      this.transition.buttons( BUTTONS.Menu, BUTTONS.Prefs );

	      this.transition.preferences( HIDE );

	      setTimeout( () => this.transition.cube( SHOW ), 500 );
	      setTimeout( () => this.transition.title( SHOW ), 1200 );

	    }

	  }

	  theme( show ) {

	    this.themeEditor.colorPicker( show );
	    
	    if ( show ) {

	      if ( this.transition.activeTransitions > 0 ) return;

	      this.cube.loadFromData( States[ '3' ][ 'checkerboard' ] );

	      this.themeEditor.setHSL( null, false );

	      this.state = STATE.Theme;

	      this.transition.buttons( BUTTONS.Theme, BUTTONS.Prefs );

	      this.transition.preferences( HIDE );

	      setTimeout( () => this.transition.cube( SHOW, true ), 500 );
	      setTimeout( () => this.transition.theming( SHOW ), 1000 );

	    } else {

	      this.state = STATE.Prefs;

	      this.transition.buttons( BUTTONS.Prefs, BUTTONS.Theme );

	      this.transition.cube( HIDE, true );
	      this.transition.theming( HIDE );

	      setTimeout( () => this.transition.preferences( SHOW ), 1000 );
	      setTimeout( () => {

	        const gameCubeData = JSON.parse( localStorage.getItem( 'theCube_savedState' ) );

	        if ( !gameCubeData ) {

	          this.cube.resize( true );
	          return;

	        }

	        this.cube.loadFromData( gameCubeData );

	      }, 1500 );

	    }

	  }

	  stats( show ) {

	    if ( show ) {

	      if ( this.transition.activeTransitions > 0 ) return;

	      this.state = STATE.Stats;

	      this.transition.buttons( BUTTONS.Stats, BUTTONS.Menu );

	      this.transition.title( HIDE );
	      this.transition.cube( HIDE );

	      setTimeout( () => this.transition.stats( SHOW ), 1000 );

	    } else {

	      this.state = STATE.Menu;

	      this.transition.buttons( BUTTONS.Menu, BUTTONS.None );

	      this.transition.stats( HIDE );

	      setTimeout( () => this.transition.cube( SHOW ), 500 );
	      setTimeout( () => this.transition.title( SHOW ), 1200 );

	    }

	  }

	  complete( show ) {

	    if ( show ) {

	      this.transition.buttons( BUTTONS.Complete, BUTTONS.Playing );

	      this.state = STATE.Complete;
	      this.saved = false;

	      this.controls.disable();
	      this.timer.stop();
	      this.storage.clearGame();

	      this.bestTime = this.scores.addScore( this.timer.deltaTime );

	      this.transition.zoom( STATE.Menu, 0 );
	      this.transition.elevate( SHOW );

	      setTimeout( () => {

	        this.transition.complete( SHOW, this.bestTime );
	        this.confetti.start();

	      }, 1000 );

	    } else {

	      this.state = STATE.Stats;
	      this.saved = false;

	      this.transition.timer( HIDE );
	      this.transition.complete( HIDE, this.bestTime );
	      this.transition.cube( HIDE );
	      this.timer.reset();

	      setTimeout( () => {

	        this.cube.reset();
	        this.confetti.stop();

	        this.transition.stats( SHOW );
	        this.transition.elevate( 0 );

	      }, 1000 );

	      return false;

	    }

	  }

	}

	window.game = new Game();

})();
