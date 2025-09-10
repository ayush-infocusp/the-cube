(function () {
	'use strict';

	const animationEngine = ( () => {

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

	class Animation {

	  constructor( start ) {

	    console.log("hello1",start);
	    if ( start === true ) this.start();

	  }

	  start() {

	    animationEngine.add( this );

	  }

	  stop() {

	    animationEngine.remove( this );

	  }

	  update( delta ) {}

	}

	class World extends Animation {

		constructor( game ) {

			super( true );

			this.game = game;

			this.container = this.game.dom.game;
			this.scene = new THREE.Scene();

			this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.container.appendChild( this.renderer.domElement );

			this.camera = new THREE.PerspectiveCamera( 2, 1, 0.1, 10000 );

			this.stage = { width: 2, height: 3 };
			this.fov = 10;

			this.createLights();

			this.onResize = [];

			this.resize();
			window.addEventListener( 'resize', () => this.resize(), false );

		}

		update() {

			this.renderer.render( this.scene, this.camera );

		}

		resize() {

			this.width = this.container.offsetWidth;
			this.height = this.container.offsetHeight;

			this.renderer.setSize( this.width, this.height );

		  this.camera.fov = this.fov;
		  this.camera.aspect = this.width / this.height;

			const aspect = this.stage.width / this.stage.height;
		  const fovRad = this.fov * THREE.Math.DEG2RAD;

		  let distance = ( aspect < this.camera.aspect )
				? ( this.stage.height / 2 ) / Math.tan( fovRad / 2 )
				: ( this.stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) );

		  distance *= 0.5;

			this.camera.position.set( distance, distance, distance);
			this.camera.lookAt( this.scene.position );
			this.camera.updateProjectionMatrix();

			const docFontSize = ( aspect < this.camera.aspect )
				? ( this.height / 100 ) * aspect
				: this.width / 100;

			document.documentElement.style.fontSize = docFontSize + 'px';

			if ( this.onResize ) this.onResize.forEach( cb => cb() );

		}

		createLights() {

			this.lights = {
				holder:  new THREE.Object3D,
				ambient: new THREE.AmbientLight( 0xffffff, 0.69 ),
				front:   new THREE.DirectionalLight( 0xffffff, 0.36 ),
				back:    new THREE.DirectionalLight( 0xffffff, 0.19 ),
			};

			this.lights.front.position.set( 1.5, 5, 3 );
			this.lights.back.position.set( -1.5, -5, -3 );

			this.lights.holder.add( this.lights.ambient );
			this.lights.holder.add( this.lights.front );
			this.lights.holder.add( this.lights.back );

			this.scene.add( this.lights.holder );

		}

	}

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

	function RoundedPlaneGeometry( size, radius, depth ) {

	  var x, y, width, height;

	  x = y = - size / 2;
	  width = height = size;
	  radius = size * radius;

	  const shape = new THREE.Shape();

	  shape.moveTo( x, y + radius );
	  shape.lineTo( x, y + height - radius );
	  shape.quadraticCurveTo( x, y + height, x + radius, y + height );
	  shape.lineTo( x + width - radius, y + height );
	  shape.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
	  shape.lineTo( x + width, y + radius );
	  shape.quadraticCurveTo( x + width, y, x + width - radius, y );
	  shape.lineTo( x + radius, y );
	  shape.quadraticCurveTo( x, y, x, y + radius );

	  const geometry = new THREE.ExtrudeBufferGeometry(
	    shape,
	    { depth: depth, bevelEnabled: false, curveSegments: 3 }
	  );

	  return geometry;

	}

	class Cube {

		constructor( game ) {

			this.game = game;
			this.size = 3;

			this.geometry = {
				pieceCornerRadius: 0.12,
				edgeCornerRoundness: 0.15,
				edgeScale: 0.82,
				edgeDepth: 0.01,
			};

			this.holder = new THREE.Object3D();
			this.object = new THREE.Object3D();
			this.animator = new THREE.Object3D();

			this.holder.add( this.animator );
			this.animator.add( this.object );

			this.game.world.scene.add( this.holder );

		}

		init() {

			this.cubes = [];
			this.object.children = [];
			this.object.add( this.game.controls.group );

			if ( this.size === 2 ) this.scale = 1.25;
			else if ( this.size === 3 ) this.scale = 1;
			else if ( this.size > 3 ) this.scale = 3 / this.size;

			this.object.scale.set( this.scale, this.scale, this.scale );

			const controlsScale = this.size === 2 ? 0.825 : 1;
			this.game.controls.edges.scale.set( controlsScale, controlsScale, controlsScale );
			
			this.generatePositions();
			this.generateModel();

			this.pieces.forEach( piece => {

				this.cubes.push( piece.userData.cube );
				this.object.add( piece );

			} );

			this.holder.traverse( node => {

				if ( node.frustumCulled ) node.frustumCulled = false;

			} );

			this.updateColors( this.game.themes.getColors() );

			this.sizeGenerated = this.size;

		}

		resize( force = false ) {

			if ( this.size !== this.sizeGenerated || force ) {

				this.size = this.game.preferences.ranges.size.value;

				this.reset();
				this.init();

				this.game.saved = false;
				this.game.timer.reset();
				this.game.storage.clearGame();

			}

		}

		reset() {

			this.game.controls.edges.rotation.set( 0, 0, 0 );

			this.holder.rotation.set( 0, 0, 0 );
			this.object.rotation.set( 0, 0, 0 );
			this.animator.rotation.set( 0, 0, 0 );

		}

		generatePositions() {

			const m = this.size - 1;
			const first = this.size % 2 !== 0
				? 0 - Math.floor(this.size / 2)
				: 0.5 - this.size / 2;

			let x, y, z;

			this.positions = [];

			for ( x = 0; x < this.size; x ++ ) {
				for ( y = 0; y < this.size; y ++ ) {
			  	for ( z = 0; z < this.size; z ++ ) {

			  		let position = new THREE.Vector3(first + x, first + y, first + z);
			  		let edges = [];

			  		if ( x == 0 ) edges.push(0);
			  		if ( x == m ) edges.push(1);
			  		if ( y == 0 ) edges.push(2);
			  		if ( y == m ) edges.push(3);
			  		if ( z == 0 ) edges.push(4);
			  		if ( z == m ) edges.push(5);

			  		position.edges = edges;
			  		this.positions.push( position );

			  	}
			  }
			}

		}

		generateModel() {

			this.pieces = [];
			this.edges = [];

			const pieceSize = 1 / 3;

			const mainMaterial = new THREE.MeshLambertMaterial();

			const pieceMesh = new THREE.Mesh(
				new RoundedBoxGeometry( pieceSize, this.geometry.pieceCornerRadius, 3 ),
				mainMaterial.clone()
			);

			const edgeGeometry = RoundedPlaneGeometry(
				pieceSize,
				this.geometry.edgeCornerRoundness,
				this.geometry.edgeDepth
			);

			this.positions.forEach( ( position, index ) => {

				const piece = new THREE.Object3D();
				const pieceCube = pieceMesh.clone();
				const pieceEdges = [];

				piece.position.copy( position.clone().divideScalar( 3 ) );
				piece.add( pieceCube );
				piece.name = index;
				piece.edgesName = '';

				position.edges.forEach( position => {

					const edge = new THREE.Mesh( edgeGeometry, mainMaterial.clone() );
					const name = [ 'L', 'R', 'D', 'U', 'B', 'F' ][ position ];
					const distance = pieceSize / 2;

					edge.position.set(
					  distance * [ -1, 1, 0, 0, 0, 0 ][ position ],
					  distance * [ 0, 0, -1, 1, 0, 0 ][ position ],
					  distance * [ 0, 0, 0, 0, -1, 1 ][ position ]
					);

					edge.rotation.set(
					  Math.PI / 2 * [ 0, 0, 1, -1, 0, 0 ][ position ],
					  Math.PI / 2 * [ -1, 1, 0, 0, 2, 0 ][ position ],
				  	0
					);

					edge.scale.set(
						this.geometry.edgeScale,
						this.geometry.edgeScale,
						this.geometry.edgeScale
					);

					edge.name = name;

					piece.add( edge );
					pieceEdges.push( name );
					this.edges.push( edge );

				} );

				piece.userData.edges = pieceEdges;
				piece.userData.cube = pieceCube;

				piece.userData.start = {
					position: piece.position.clone(),
					rotation: piece.rotation.clone(),
				};

				this.pieces.push( piece );

			} );

		}

		updateColors( colors ) {

			if ( typeof this.pieces !== 'object' && typeof this.edges !== 'object' ) return;

	    this.pieces.forEach( piece => piece.userData.cube.material.color.setHex( colors.P ) );
	    this.edges.forEach( edge => edge.material.color.setHex( colors[ edge.name ] ) );

		}

		loadFromData( data ) {

			this.size = data.size;

			this.reset();
			this.init();

			this.pieces.forEach( piece => {

	      const index = data.names.indexOf( piece.name );

	      const position = data.positions[index];
	      const rotation = data.rotations[index];

	      piece.position.set( position.x, position.y, position.z );
	      piece.rotation.set( rotation.x, rotation.y, rotation.z );

	    } );

		}

	}

	const Easing = {

	  Power: {

	    In: power => {

	      power = Math.round( power || 1 );

	      return t => Math.pow( t, power );

	    },

	    Out: power => {

	      power = Math.round( power || 1 );

	      return t => 1 - Math.abs( Math.pow( t - 1, power ) );

	    },

	    InOut: power => {

	      power = Math.round( power || 1 );

	      return t => ( t < 0.5 )
	        ? Math.pow( t * 2, power ) / 2
	        : ( 1 - Math.abs( Math.pow( ( t * 2 - 1 ) - 1, power ) ) ) / 2 + 0.5;

	    },

	  },

	  Sine: {

	    In: () => t => 1 + Math.sin( Math.PI / 2 * t - Math.PI / 2 ),

	    Out: () => t => Math.sin( Math.PI / 2 * t ),

	    InOut: () => t => ( 1 + Math.sin( Math.PI * t - Math.PI / 2 ) ) / 2,

	  },

	  Back: {

	    Out: s => {

	      s = s || 1.70158;

	      return t => { return ( t -= 1 ) * t * ( ( s + 1 ) * t + s ) + 1; };

	    },

	    In: s => {

	      s = s || 1.70158;

	      return t => { return t * t * ( ( s + 1 ) * t - s ); };

	    }

	  },

	  Elastic: {

	    Out: ( amplitude, period ) => {

	      let PI2 = Math.PI * 2;

	      let p1 = ( amplitude >= 1 ) ? amplitude : 1;
	      let p2 = ( period || 0.3 ) / ( amplitude < 1 ? amplitude : 1 );
	      let p3 = p2 / PI2 * ( Math.asin( 1 / p1 ) || 0 );

	      p2 = PI2 / p2;

	      return t => { return p1 * Math.pow( 2, -10 * t ) * Math.sin( ( t - p3 ) * p2 ) + 1 }

	    },

	  },

	};

	class Tween extends Animation {

	  constructor( options ) {

	    super( false );

	    this.duration = options.duration || 500;
	    this.easing = options.easing || ( t => t );
	    this.onUpdate = options.onUpdate || ( () => {} );
	    this.onComplete = options.onComplete || ( () => {} );

	    this.delay = options.delay || false;
	    this.yoyo = options.yoyo ? false : null;

	    this.progress = 0;
	    this.value = 0;
	    this.delta = 0;

	    this.getFromTo( options );

	    if ( this.delay ) setTimeout( () => super.start(), this.delay );
	    else super.start();

	    this.onUpdate( this );

	  }

	  update( delta ) {

	    const old = this.value * 1;
	    const direction = ( this.yoyo === true ) ? -1 : 1;

	    this.progress += ( delta / this.duration ) * direction;

	    this.value = this.easing( this.progress );
	    this.delta = this.value - old;

	    if ( this.values !== null ) this.updateFromTo();

	    if ( this.yoyo !== null ) this.updateYoyo();
	    else if ( this.progress <= 1 ) this.onUpdate( this );
	    else {

	      this.progress = 1;
	      this.value = 1;
	      this.onUpdate( this );
	      this.onComplete( this );
	      super.stop();      

	    }

	  }

	  updateYoyo() {

	    if ( this.progress > 1 || this.progress < 0 ) {

	      this.value = this.progress = ( this.progress > 1 ) ? 1 : 0;
	      this.yoyo = ! this.yoyo;

	    }

	    this.onUpdate( this );

	  }

	  updateFromTo() {

	    this.values.forEach( key => {

	      this.target[ key ] = this.from[ key ] + ( this.to[ key ] - this.from[ key ] ) * this.value;

	    } );

	  }

	  getFromTo( options ) {

	    if ( ! options.target || ! options.to ) {

	      this.values = null;
	      return;

	    }

	    this.target = options.target || null;
	    this.from = options.from || {};
	    this.to = options.to || null;
	    this.values = [];

	    if ( Object.keys( this.from ).length < 1 )
	      Object.keys( this.to ).forEach( key => { this.from[ key ] = this.target[ key ]; } );

	    Object.keys( this.to ).forEach( key => { this.values.push( key ); } );

	  }

	}

	window.addEventListener( 'touchmove', () => {} );
	document.addEventListener( 'touchmove',  event => { event.preventDefault(); }, { passive: false } );

	class Draggable {

	  constructor( element, options ) {

	    this.position = {
	      current: new THREE.Vector2(),
	      start: new THREE.Vector2(),
	      delta: new THREE.Vector2(),
	      old: new THREE.Vector2(),
	      drag: new THREE.Vector2(),
	    };

	    this.options = Object.assign( {
	      calcDelta: false,
	    }, options || {} );

	    this.element = element;
	    this.touch = null;

	    this.drag = {

	      start: ( event ) => {

	        if ( event.type == 'mousedown' && event.which != 1 ) return;
	        if ( event.type == 'touchstart' && event.touches.length > 1 ) return;

	        this.getPositionCurrent( event );

	        if ( this.options.calcDelta ) {

	          this.position.start = this.position.current.clone();
	          this.position.delta.set( 0, 0 );
	          this.position.drag.set( 0, 0 );

	        }

	        this.touch = ( event.type == 'touchstart' );

	        this.onDragStart( this.position );

	        window.addEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.addEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	      move: ( event ) => {

	        if ( this.options.calcDelta ) {

	          this.position.old = this.position.current.clone();

	        }

	        this.getPositionCurrent( event );

	        if ( this.options.calcDelta ) {

	          this.position.delta = this.position.current.clone().sub( this.position.old );
	          this.position.drag = this.position.current.clone().sub( this.position.start );

	        }

	        this.onDragMove( this.position );

	      },

	      end: ( event ) => {

	        this.getPositionCurrent( event );

	        this.onDragEnd( this.position );

	        window.removeEventListener( ( this.touch ) ? 'touchmove' : 'mousemove', this.drag.move, false );
	        window.removeEventListener( ( this.touch ) ? 'touchend' : 'mouseup', this.drag.end, false );

	      },

	    };

	    this.onDragStart = () => {};
	    this.onDragMove = () => {};
	    this.onDragEnd = () => {};

	    this.enable();

	    return this;

	  }

	  enable() {

	    this.element.addEventListener( 'touchstart', this.drag.start, false );
	    this.element.addEventListener( 'mousedown', this.drag.start, false );

	    return this;

	  }

	  disable() {

	    this.element.removeEventListener( 'touchstart', this.drag.start, false );
	    this.element.removeEventListener( 'mousedown', this.drag.start, false );

	    return this;

	  }

	  getPositionCurrent( event ) {

	    const dragEvent = event.touches
	      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
	      : event;

	    this.position.current.set( dragEvent.pageX, dragEvent.pageY );

	  }

	  convertPosition( position ) {

	    position.x = ( position.x / this.element.offsetWidth ) * 2 - 1;
	    position.y = - ( ( position.y / this.element.offsetHeight ) * 2 - 1 );

	    return position;

	  }

	}

	const STILL = 0;
	const PREPARING = 1;
	const ROTATING = 2;
	const ANIMATING = 3;

	class Controls {

	  constructor( game ) {

	    this.game = game;

	    this.flipConfig = 0;

	    this.flipEasings = [ Easing.Power.Out( 3 ), Easing.Sine.Out(), Easing.Back.Out( 1.5 ) ];
	    this.flipSpeeds = [ 125, 200, 300 ];

	    this.raycaster = new THREE.Raycaster();

	    const helperMaterial = new THREE.MeshBasicMaterial( { depthWrite: false, transparent: true, opacity: 0, color: 0x0033ff } );

	    this.group = new THREE.Object3D();
	    this.group.name = 'controls';
	    this.game.cube.object.add( this.group );

	    this.helper = new THREE.Mesh(
	      new THREE.PlaneBufferGeometry( 200, 200 ),
	      helperMaterial.clone()
	    );

	    this.helper.rotation.set( 0, Math.PI / 4, 0 );
	    this.game.world.scene.add( this.helper );

	    this.edges = new THREE.Mesh(
	      new THREE.BoxBufferGeometry( 1, 1, 1 ),
	      helperMaterial.clone(),
	    );

	    this.game.world.scene.add( this.edges );

	    this.onSolved = () => {};
	    this.onMove = () => {};

	    this.momentum = [];

	    this.scramble = null;
	    this.state = STILL;
	    this.enabled = false;

	    this.initDraggable();

	  }

	  enable() {

	    this.draggable.enable();
	    this.enabled = true;

	  }

	  disable() {

	    this.draggable.disable();
	    this.enabled = false;

	  }

	  initDraggable() {

	    this.draggable = new Draggable( this.game.dom.game );

	    this.draggable.onDragStart = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state === PREPARING || this.state === ROTATING ) return;

	      this.gettingDrag = this.state === ANIMATING;

	      const edgeIntersect = this.getIntersect( position.current, this.edges, false );

	      if ( edgeIntersect !== false ) {

	        this.dragIntersect = this.getIntersect( position.current, this.game.cube.cubes, true );

	      }

	      if ( edgeIntersect !== false && this.dragIntersect !== false ) {

	        this.dragNormal = edgeIntersect.face.normal.round();
	        this.flipType = 'layer';

	        this.attach( this.helper, this.edges );

	        this.helper.rotation.set( 0, 0, 0 );
	        this.helper.position.set( 0, 0, 0 );
	        this.helper.lookAt( this.dragNormal );
	        this.helper.translateZ( 0.5 );
	        this.helper.updateMatrixWorld();

	        this.detach( this.helper, this.edges );

	      } else {

	        this.dragNormal = new THREE.Vector3( 0, 0, 1 );
	        this.flipType = 'cube';

	        this.helper.position.set( 0, 0, 0 );
	        this.helper.rotation.set( 0, Math.PI / 4, 0 );
	        this.helper.updateMatrixWorld();

	      }

	      let planeIntersect = this.getIntersect( position.current, this.helper, false );
	      if ( planeIntersect === false ) return;

	      this.dragCurrent = this.helper.worldToLocal( planeIntersect.point );
	      this.dragTotal = new THREE.Vector3();
	      this.state = ( this.state === STILL ) ? PREPARING : this.state;

	    };

	    this.draggable.onDragMove = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state === STILL || ( this.state === ANIMATING && this.gettingDrag === false ) ) return;

	      const planeIntersect = this.getIntersect( position.current, this.helper, false );
	      if ( planeIntersect === false ) return;

	      const point = this.helper.worldToLocal( planeIntersect.point.clone() );

	      this.dragDelta = point.clone().sub( this.dragCurrent ).setZ( 0 );
	      this.dragTotal.add( this.dragDelta );
	      this.dragCurrent = point;
	      this.addMomentumPoint( this.dragDelta );

	      if ( this.state === PREPARING && this.dragTotal.length() > 0.05 ) {

	        this.dragDirection = this.getMainAxis( this.dragTotal );

	        if ( this.flipType === 'layer' ) {

	          const direction = new THREE.Vector3();
	          direction[ this.dragDirection ] = 1;

	          const worldDirection = this.helper.localToWorld( direction ).sub( this.helper.position );
	          const objectDirection = this.edges.worldToLocal( worldDirection ).round();

	          this.flipAxis = objectDirection.cross( this.dragNormal ).negate();

	          this.selectLayer( this.getLayer( false ) );

	        } else {

	          const axis = ( this.dragDirection != 'x' )
	            ? ( ( this.dragDirection == 'y' && position.current.x > this.game.world.width / 2 ) ? 'z' : 'x' )
	            : 'y';

	          this.flipAxis = new THREE.Vector3();
	          this.flipAxis[ axis ] = 1 * ( ( axis == 'x' ) ? -1 : 1 );

	        }

	        this.flipAngle = 0;
	        this.state = ROTATING;

	      } else if ( this.state === ROTATING ) {

	        const rotation = this.dragDelta[ this.dragDirection ];

	        if ( this.flipType === 'layer' ) { 

	          this.group.rotateOnAxis( this.flipAxis, rotation );
	          this.flipAngle += rotation;

	        } else {

	          this.edges.rotateOnWorldAxis( this.flipAxis, rotation );
	          this.game.cube.object.rotation.copy( this.edges.rotation );
	          this.flipAngle += rotation;

	        }

	      }

	    };

	    this.draggable.onDragEnd = position => {

	      if ( this.scramble !== null ) return;
	      if ( this.state !== ROTATING ) {

	        this.gettingDrag = false;
	        this.state = STILL;
	        return;

	      }

	      this.state = ANIMATING;

	      const momentum = this.getMomentum()[ this.dragDirection ];
	      const flip = ( Math.abs( momentum ) > 0.05 && Math.abs( this.flipAngle ) < Math.PI / 2 );

	      const angle = flip
	        ? this.roundAngle( this.flipAngle + Math.sign( this.flipAngle ) * ( Math.PI / 4 ) )
	        : this.roundAngle( this.flipAngle );

	      const delta = angle - this.flipAngle;

	      if ( this.flipType === 'layer' ) {

	        this.rotateLayer( delta, false, layer => {

	          this.game.storage.saveGame();
	          
	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;

	          this.checkIsSolved();

	        } );

	      } else {

	        this.rotateCube( delta, () => {

	          this.state = this.gettingDrag ? PREPARING : STILL;
	          this.gettingDrag = false;

	        } );

	      }

	    };

	  }

	  rotateLayer( rotation, scramble, callback ) {

	    const config = scramble ? 0 : this.flipConfig;

	    const easing = this.flipEasings[ config ];
	    const duration = this.flipSpeeds[ config ];
	    const bounce = ( config == 2 ) ? this.bounceCube() : ( () => {} );

	    this.rotationTween = new Tween( {
	      easing: easing,
	      duration: duration,
	      onUpdate: tween => {

	        let deltaAngle = tween.delta * rotation;
	        this.group.rotateOnAxis( this.flipAxis, deltaAngle );
	        bounce( tween.value, deltaAngle, rotation );

	      },
	      onComplete: () => {

	        if ( ! scramble ) this.onMove();

	        const layer = this.flipLayer.slice( 0 );

	        this.game.cube.object.rotation.setFromVector3( this.snapRotation( this.game.cube.object.rotation.toVector3() ) );
	        this.group.rotation.setFromVector3( this.snapRotation( this.group.rotation.toVector3() ) );
	        this.deselectLayer( this.flipLayer );

	        callback( layer );

	      },
	    } );

	  }

	  bounceCube() {

	    let fixDelta = true;

	    return ( progress, delta, rotation ) => {

	        if ( progress >= 1 ) {

	          if ( fixDelta ) {

	            delta = ( progress - 1 ) * rotation;
	            fixDelta = false;

	          }

	          this.game.cube.object.rotateOnAxis( this.flipAxis, delta );

	        }

	    }

	  }

	  rotateCube( rotation, callback ) {

	    const config = this.flipConfig;
	    const easing = [ Easing.Power.Out( 4 ), Easing.Sine.Out(), Easing.Back.Out( 2 ) ][ config ];
	    const duration = [ 100, 150, 350 ][ config ];

	    this.rotationTween = new Tween( {
	      easing: easing,
	      duration: duration,
	      onUpdate: tween => {

	        this.edges.rotateOnWorldAxis( this.flipAxis, tween.delta * rotation );
	        this.game.cube.object.rotation.copy( this.edges.rotation );

	      },
	      onComplete: () => {

	        this.edges.rotation.setFromVector3( this.snapRotation( this.edges.rotation.toVector3() ) );
	        this.game.cube.object.rotation.copy( this.edges.rotation );
	        callback();

	      },
	    } );

	  }

	  selectLayer( layer ) {

	    this.group.rotation.set( 0, 0, 0 );
	    this.movePieces( layer, this.game.cube.object, this.group );
	    this.flipLayer = layer;

	  }

	  deselectLayer( layer ) {

	    this.movePieces( layer, this.group, this.game.cube.object );
	    this.flipLayer = null;

	  }

	  movePieces( layer, from, to ) {

	    from.updateMatrixWorld();
	    to.updateMatrixWorld();

	    layer.forEach( index => {

	      const piece = this.game.cube.pieces[ index ];

	      piece.applyMatrix( from.matrixWorld );
	      from.remove( piece );
	      piece.applyMatrix( new THREE.Matrix4().getInverse( to.matrixWorld ) );
	      to.add( piece );

	    } );

	  }

	  getLayer( position ) {

	    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[ this.game.cube.size ];
	    const layer = [];

	    let axis;

	    if ( position === false ) {

	      const piece = this.dragIntersect.object.parent;

	      axis = this.getMainAxis( this.flipAxis );
	      position = piece.position.clone() .multiplyScalar( scalar ) .round();

	    } else {

	      axis = this.getMainAxis( position );

	    }

	    this.game.cube.pieces.forEach( piece => {

	      const piecePosition = piece.position.clone().multiplyScalar( scalar ).round();

	      if ( piecePosition[ axis ] == position[ axis ] ) layer.push( piece.name );

	    } );

	    return layer;

	  }

	  keyboardMove( type, move, callback ) {

	    if ( this.state !== STILL ) return;
	    if ( this.enabled !== true ) return;

	    if ( type === 'LAYER' ) {

	      const layer = this.getLayer( move.position );

	      this.flipAxis = new THREE.Vector3();
	      this.flipAxis[ move.axis ] = 1;
	      this.state = ROTATING;

	      this.selectLayer( layer );
	      this.rotateLayer( move.angle, false, layer => {

	        this.game.storage.saveGame();
	        this.state = STILL;
	        this.checkIsSolved();

	      } );

	    } else if ( type === 'CUBE' ) {

	      this.flipAxis = new THREE.Vector3();
	      this.flipAxis[ move.axis ] = 1;
	      this.state = ROTATING;

	      this.rotateCube( move.angle, () => {

	        this.state = STILL;

	      } );

	    }

	  }

	  scrambleCube() {

	    if ( this.scramble == null ) {

	      this.scramble = this.game.scrambler;
	      this.scramble.callback = ( typeof callback !== 'function' ) ? () => {} : callback;

	    }

	    const converted = this.scramble.converted;
	    const move = converted[ 0 ];
	    const layer = this.getLayer( move.position );

	    this.flipAxis = new THREE.Vector3();
	    this.flipAxis[ move.axis ] = 1;

	    this.selectLayer( layer );
	    this.rotateLayer( move.angle, true, () => {

	      converted.shift();

	      if ( converted.length > 0 ) {

	        this.scrambleCube();

	      } else {

	        this.scramble = null;
	        // this.game.storage.saveGame();

	      }

	    } );

	  }

	  getIntersect( position, object, multiple ) {

	    this.raycaster.setFromCamera(
	      this.draggable.convertPosition( position.clone() ),
	      this.game.world.camera
	    );

	    const intersect = ( multiple )
	      ? this.raycaster.intersectObjects( object )
	      : this.raycaster.intersectObject( object );

	    return ( intersect.length > 0 ) ? intersect[ 0 ] : false;

	  }

	  getMainAxis( vector ) {

	    return Object.keys( vector ).reduce(
	      ( a, b ) => Math.abs( vector[ a ] ) > Math.abs( vector[ b ] ) ? a : b
	    );

	  }

	  detach( child, parent ) {

	    child.applyMatrix( parent.matrixWorld );
	    parent.remove( child );
	    this.game.world.scene.add( child );

	  }

	  attach( child, parent ) {

	    child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );
	    this.game.world.scene.remove( child );
	    parent.add( child );

	  }

	  addMomentumPoint( delta ) {

	    const time = Date.now();

	    this.momentum = this.momentum.filter( moment => time - moment.time < 500 );

	    if ( delta !== false ) this.momentum.push( { delta, time } );

	  }

	  getMomentum() {

	    const points = this.momentum.length;
	    const momentum = new THREE.Vector2();

	    this.addMomentumPoint( false );

	    this.momentum.forEach( ( point, index ) => {

	      momentum.add( point.delta.multiplyScalar( index / points ) );

	    } );

	    return momentum;

	  }

	  roundAngle( angle ) {

	    const round = Math.PI / 2;
	    return Math.sign( angle ) * Math.round( Math.abs( angle) / round ) * round;

	  }

	  snapRotation( angle ) {

	    return angle.set(
	      this.roundAngle( angle.x ),
	      this.roundAngle( angle.y ),
	      this.roundAngle( angle.z )
	    );

	  }

	  checkIsSolved() {

	    performance.now();

	    let solved = true;
	    const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] };

	    this.game.cube.edges.forEach( edge => {

	      const position = edge.parent
	        .localToWorld( edge.position.clone() )
	        .sub( this.game.cube.object.position );

	      const mainAxis = this.getMainAxis( position );
	      const mainSign = position.multiplyScalar( 2 ).round()[ mainAxis ] < 1 ? '-' : '+';

	      sides[ mainAxis + mainSign ].push( edge.name );

	    } );

	    Object.keys( sides ).forEach( side => {

	      if ( ! sides[ side ].every( value => value === sides[ side ][ 0 ] ) ) solved = false;

	    } );

	    if ( solved ) this.onSolved();

	  }

	}

	class Scrambler {

		constructor( game ) {

			this.game = game;

			this.dificulty = 0;

			this.scrambleLength = {
				2: [ 7, 9, 11 ],
				3: [ 20, 25, 30 ],
				4: [ 30, 40, 50 ],
				5: [ 40, 60, 80 ],
			};

			this.moves = [];
			this.conveted = [];
			this.pring = '';

		}

		scramble( scramble ) {
			console.log( scramble );
			this.moves = ( typeof scramble !== 'undefined' ) ? scramble.split( ' ' ) : [];

			// if ( this.moves.length < 1 ) {

			// 	const scrambleLength = this.scrambleLength[ this.game.cube.size ][ this.dificulty ];

			// 	const faces = this.game.cube.size < 4 ? 'UDLRFB' : 'UuDdLlRrFfBb';
			// 	const modifiers = [ "", "'", "2"];
			// 	const total = ( typeof scramble === 'undefined' ) ? scrambleLength : scramble;

			// 	while ( count < total ) {

			// 		const move =
			// 			faces[ Math.floor( Math.random() * faces.length ) ] +
			// 			modifiers[ Math.floor( Math.random() * 3 ) ];

			// 		if ( count > 0 && move.charAt( 0 ) == this.moves[ count - 1 ].charAt( 0 ) ) continue;
			// 		if ( count > 1 && move.charAt( 0 ) == this.moves[ count - 2 ].charAt( 0 ) ) continue;

			// 		this.moves.push( move );
			// 		count ++;

			// 	}

			// }

			this.callback = () => {};
			this.convert();
			this.print = this.moves.join( ' ' );

			return this;

		}

		convert( moves ) {

			this.converted = [];

			this.moves.forEach( move => {

				const convertedMove = this.convertMove( move );
				const modifier = move.charAt( 1 );

				this.converted.push( convertedMove );
				if ( modifier == "2" ) this.converted.push( convertedMove );

			} );

		}

		convertMove( move ) {

			const face = move.charAt( 0 );
			const modifier = move.charAt( 1 );

			const axis = { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face.toUpperCase() ];
			let row = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }[ face.toUpperCase() ];

			if ( this.game.cube.size > 3 && face !== face.toLowerCase() ) row = row * 2;

			const position = new THREE.Vector3();
			position[ { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }[ face.toUpperCase() ] ] = row;

			const angle = ( Math.PI / 2 ) * - row * ( ( modifier == "'" ) ? -1 : 1 );

			return { position, axis, angle, name: move };

		}

	}

	class Transition {

	  constructor( game ) {

	    this.game = game;

	    this.tweens = {};
	    this.durations = {};
	    this.data = {
	      cubeY: -0.2,
	      cameraZoom: 0.85,
	    };

	    this.activeTransitions = 0;

	  }

	  init() {

	    this.game.controls.disable();

	    this.game.cube.object.position.y = this.data.cubeY;
	    this.game.cube.animator.position.y = 4;
	    this.game.cube.animator.rotation.x = - Math.PI / 3;
	    this.game.world.camera.zoom = this.data.cameraZoom;
	    this.game.world.camera.updateProjectionMatrix();

	    this.tweens.buttons = {};
	    this.tweens.timer = [];
	    this.tweens.title = [];
	    this.tweens.best = [];
	    this.tweens.complete = [];
	    this.tweens.prefs = [];
	    this.tweens.theme = [];
	    this.tweens.stats = [];

	  }

	  buttons( show, hide ) {

	    const buttonTween = ( button, show ) => {

	      return new Tween( {
	        target: button.style,
	        duration: 300,
	        easing: show ? Easing.Power.Out( 2 ) : Easing.Power.In( 3 ),
	        from: { opacity: show ? 0 : 1 },
	        to: { opacity: show ? 1 : 0 },
	        onUpdate: tween => {

	          const translate = show ? 1 - tween.value : tween.value;
	          button.style.transform = `translate3d(0, ${translate * 1.5}em, 0)`;

	        },
	        onComplete: () => button.style.pointerEvents = show ? 'all' : 'none'
	      } );

	    };

	    hide.forEach( button =>
	      this.tweens.buttons[ button ] = buttonTween( this.game.dom.buttons[ button ], false )
	    );

	    setTimeout( () => show.forEach( button => {

	      this.tweens.buttons[ button ] = buttonTween( this.game.dom.buttons[ button ], true );

	    } ), hide ? 500 : 0 );

	  }

	  cube( show, theming = false ) {

	    this.activeTransitions++;

	    try { this.tweens.cube.stop(); } catch(e) {}
	    const currentY = this.game.cube.animator.position.y;
	    const currentRotation = this.game.cube.animator.rotation.x;

	    this.tweens.cube = new Tween( {
	      duration: show ? 3000 : 1250,
	      easing: show ? Easing.Elastic.Out( 0.8, 0.6 ) : Easing.Back.In( 1 ),
	      onUpdate: tween => {

	        this.game.cube.animator.position.y = show
	          ? ( theming ? 0.9 + ( 1 - tween.value ) * 3.5 : ( 1 - tween.value ) * 4 )
	          : currentY + tween.value * 4;

	        this.game.cube.animator.rotation.x = show
	          ? ( 1 - tween.value ) * Math.PI / 3
	          : currentRotation + tween.value * - Math.PI / 3;

	      },
	    } );

	    if ( theming ) {

	      if ( show ) {

	        this.game.world.camera.zoom = 0.75;
	        this.game.world.camera.updateProjectionMatrix();

	      } else {

	        setTimeout( () => {

	          this.game.world.camera.zoom = this.data.cameraZoom;
	          this.game.world.camera.updateProjectionMatrix();

	        }, 1500 );

	      }

	    }

	    this.durations.cube = show ? 1500 : 1500;

	    setTimeout( () => this.activeTransitions--, this.durations.cube );

	  }

	  float() {

	    try { this.tweens.float.stop(); } catch(e) {}
	    this.tweens.float = new Tween( {
	      duration: 1500,
	      easing: Easing.Sine.InOut(),
	      yoyo: true,
	      onUpdate: tween => {

	        this.game.cube.holder.position.y = (-0.02 + tween.value * 0.04); 
	        this.game.cube.holder.rotation.x = 0.005 - tween.value * 0.01;
	        this.game.cube.holder.rotation.z = - this.game.cube.holder.rotation.x;
	        this.game.cube.holder.rotation.y = this.game.cube.holder.rotation.x;

	        this.game.controls.edges.position.y =
	          this.game.cube.holder.position.y + this.game.cube.object.position.y;

	      },
	    } );

	  }

	  zoom( play, time ) {

	    this.activeTransitions++;

	    const zoom = ( play ) ? 1 : this.data.cameraZoom;
	    const duration = ( time > 0 ) ? Math.max( time, 1500 ) : 1500;
	    const rotations = ( time > 0 ) ? Math.round( duration / 1500 ) : 1;
	    const easing = Easing.Power.InOut( ( time > 0 ) ? 2 : 3 );

	    this.tweens.zoom = new Tween( {
	      target: this.game.world.camera,
	      duration: duration,
	      easing: easing,
	      to: { zoom: zoom },
	      onUpdate: () => { this.game.world.camera.updateProjectionMatrix(); },
	    } );

	    this.tweens.rotate = new Tween( {
	      target: this.game.cube.animator.rotation,
	      duration: duration,
	      easing: easing,
	      to: { y: - Math.PI * 2 * rotations },
	      onComplete: () => { this.game.cube.animator.rotation.y = 0; },
	    } );

	    this.durations.zoom = duration;

	    setTimeout( () => this.activeTransitions--, this.durations.zoom );

	  }

	  elevate( complete ) {

	    this.activeTransitions++;

	    this.tweens.elevate = new Tween( {
	      target: this.game.cube.object.position,
	      duration: complete ? 1500 : 0,
	      easing: Easing.Power.InOut( 3 ),
	      to: { y: complete ? -0.05 : this.data.cubeY }
	    } );

	    this.durations.elevate = 1500;

	    setTimeout( () => this.activeTransitions--, this.durations.elevate );

	  }

	  complete( show, best ) {

	    this.activeTransitions++;

	    const text = best ? this.game.dom.texts.best : this.game.dom.texts.complete;

	    if ( text.querySelector( 'span i' ) === null )
	      text.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

	    const letters = text.querySelectorAll( '.icon, i' );

	    this.flipLetters( best ? 'best' : 'complete', letters, show );

	    text.style.opacity = 1;

	    const duration = this.durations[ best ? 'best' : 'complete' ];

	    if ( ! show ) setTimeout( () => this.game.dom.texts.timer.style.transform = '', duration );

	    setTimeout( () => this.activeTransitions--, duration );

	  } 

	  stats( show ) {

	    if ( show ) this.game.scores.calcStats();

	    this.activeTransitions++;

	    this.tweens.stats.forEach( tween => { tween.stop(); tween = null; } );

	    let tweenId = -1;

	    const stats = this.game.dom.stats.querySelectorAll( '.stats' );
	    const easing = show ? Easing.Power.Out( 2 ) : Easing.Power.In( 3 );

	    stats.forEach( ( stat, index ) => {

	      const delay = index * ( show ? 80 : 60 );

	      this.tweens.stats[ tweenId++ ] = new Tween( {
	        delay: delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) * 2 : tween.value;
	          const opacity = show ? tween.value : ( 1 - tween.value );

	          stat.style.transform = `translate3d(0, ${translate}em, 0)`;
	          stat.style.opacity = opacity;

	        }
	      } );

	    } );

	    this.durations.stats = 0;

	    setTimeout( () => this.activeTransitions--, this.durations.stats );

	  }

	  preferences( show ) {

	    this.ranges( this.game.dom.prefs.querySelectorAll( '.range' ), 'prefs', show );

	  }

	  theming( show ) {

	    this.ranges( this.game.dom.theme.querySelectorAll( '.range' ), 'prefs', show );

	  }

	  ranges( ranges, type, show ) {

	    this.activeTransitions++;

	    this.tweens[ type ].forEach( tween => { tween.stop(); tween = null; } );

	    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3);

	    let tweenId = -1;
	    let listMax = 0;

	    ranges.forEach( ( range, rangeIndex ) => {
	    
	      const label = range.querySelector( '.range__label' );
	      const track = range.querySelector( '.range__track-line' );
	      const handle = range.querySelector( '.range__handle' );
	      const list = range.querySelectorAll( '.range__list div' );

	      const delay = rangeIndex * ( show ? 120 : 100 );

	      label.style.opacity = show ? 0 : 1;
	      track.style.opacity = show ? 0 : 1;
	      handle.style.opacity = show ? 0 : 1;
	      handle.style.pointerEvents = show ? 'all' : 'none';

	      this.tweens[ type ][ tweenId++ ] = new Tween( {
	        delay: show ? delay : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const opacity = show ? tween.value : ( 1 - tween.value );

	          label.style.transform = `translate3d(0, ${translate}em, 0)`;
	          label.style.opacity = opacity;

	        }
	      } );

	      this.tweens[ type ][ tweenId++ ] = new Tween( {
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const scale = show ? tween.value : ( 1 - tween.value );
	          const opacity = scale;

	          track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`;
	          track.style.opacity = opacity;

	        }
	      } );

	      this.tweens[ type ][ tweenId++ ] = new Tween( {
	        delay: show ? delay + 100 : delay,
	        duration: 400,
	        easing: easing,
	        onUpdate: tween => {

	          const translate = show ? ( 1 - tween.value ) : tween.value;
	          const opacity = 1 - translate;
	          const scale = 0.5 + opacity * 0.5;

	          handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`;
	          handle.style.opacity = opacity;

	        }
	      } );

	      list.forEach( ( listItem, labelIndex ) => {

	        listItem.style.opacity = show ? 0 : 1;

	        this.tweens[ type ][ tweenId++ ] = new Tween( {
	          delay: show ? delay + 200 + labelIndex * 50 : delay,
	          duration: 400,
	          easing: easing,
	          onUpdate: tween => {

	            const translate = show ? ( 1 - tween.value ) : tween.value;
	            const opacity = show ? tween.value : ( 1 - tween.value );

	            listItem.style.transform = `translate3d(0, ${translate}em, 0)`;
	            listItem.style.opacity = opacity;

	          }
	        } );

	      } );

	      listMax = list.length > listMax ? list.length - 1 : listMax;

	      range.style.opacity = 1;

	    } );

	    this.durations[ type ] = show
	      ? ( ( ranges.length - 1 ) * 100 ) + 200 + listMax * 50 + 400
	      : ( ( ranges.length - 1 ) * 100 ) + 400;

	    setTimeout( () => this.activeTransitions--, this.durations[ type ] ); 

	  }

	  title( show ) {

	    this.activeTransitions++;

	    const title = this.game.dom.texts.title;

	    if ( title.querySelector( 'span i' ) === null )
	      title.querySelectorAll( 'span' ).forEach( span => this.splitLetters( span ) );

	    const letters = title.querySelectorAll( 'i' );

	    this.flipLetters( 'title', letters, show );

	    title.style.opacity = 1;

	    const note = this.game.dom.texts.note;

	    this.tweens.title[ letters.length ] = new Tween( {
	      target: note.style,
	      easing: Easing.Sine.InOut(),
	      duration: show ? 800 : 400,
	      yoyo: show ? true : null,
	      from: { opacity: show ? 0 : ( parseFloat( getComputedStyle( note ).opacity ) ) },
	      to: { opacity: show ? 1 : 0 },
	    } );

	    setTimeout( () => this.activeTransitions--, this.durations.title );

	  }

	  timer( show ) {

	    // this.activeTransitions++;

	    // const timer = this.game.dom.texts.button;

	    // timer.style.opacity = 0;
	    // this.game.timer.convert();
	    // this.game.timer.setText();

	    // this.splitLetters( timer );
	    // const letters = timer.querySelectorAll( 'i' );
	    // this.flipLetters( 'timer', letters, show );

	    // timer.style.opacity = 1;

	    // setTimeout( () => this.activeTransitions--, this.durations.timer );np

	  }

	  splitLetters( element ) {

	    const text = element.innerHTML;

	    element.innerHTML = '';

	    text.split( '' ).forEach( letter => {

	      const i = document.createElement( 'i' );

	      i.innerHTML = letter;

	      element.appendChild( i );

	    } );

	  }

	  flipLetters( type, letters, show ) {

	    try { this.tweens[ type ].forEach( tween => tween.stop() ); } catch(e) {}
	    letters.forEach( ( letter, index ) => {

	      letter.style.opacity = show ? 0 : 1;

	      this.tweens[ type ][ index ] = new Tween( {
	        easing: Easing.Sine.Out(),
	        duration: show ? 800 : 400,
	        delay: index * 50,
	        onUpdate: tween => {

	          const rotation = show ? ( 1 - tween.value ) * -80 : tween.value * 80;

	          letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`;
	          letter.style.opacity = show ? tween.value : ( 1 - tween.value );

	        },
	      } );

	    } );

	    this.durations[ type ] = ( letters.length - 1 ) * 50 + ( show ? 800 : 400 );

	  }

	}

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

	class Range {

	  constructor( name, options ) {

	    options = Object.assign( {
	      range: [ 0, 1 ],
	      value: 0,
	      step: 0,
	      onUpdate: () => {},
	      onComplete: () => {},
	    }, options || {} );

	    this.element = document.querySelector( '.range[name="' + name + '"]' );
	    this.track = this.element.querySelector( '.range__track' );
	    this.handle = this.element.querySelector( '.range__handle' );
	    this.list = [].slice.call( this.element.querySelectorAll( '.range__list div' ) );

	    this.value = options.value;
	    this.min = options.range[0];
	    this.max = options.range[1];
	    this.step = options.step;

	    this.onUpdate = options.onUpdate;
	    this.onComplete = options.onComplete;

	    this.setValue( this.value );

	    this.initDraggable();

	  }

	  setValue( value ) {

	    this.value = this.round( this.limitValue( value ) );
	    this.setHandlePosition();

	  }

	  initDraggable() {

	    let current;

	    this.draggable = new Draggable( this.handle, { calcDelta: true } );

	    this.draggable.onDragStart = position => {

	      current = this.positionFromValue( this.value );
	      this.handle.style.left = current + 'px';

	    };

	    this.draggable.onDragMove = position => {

	      current = this.limitPosition( current + position.delta.x );
	      this.value = this.round( this.valueFromPosition( current ) );
	      this.setHandlePosition();
	      
	      this.onUpdate( this.value );

	    };

	    this.draggable.onDragEnd = position => {

	      this.onComplete( this.value );

	    };

	  }

	  round( value ) {

	    if ( this.step < 1 ) return value;

	    return Math.round( ( value - this.min ) / this.step ) * this.step + this.min;

	  }

	  limitValue( value ) {

	    const max = Math.max( this.max, this.min );
	    const min = Math.min( this.max, this.min );

	    return Math.min( Math.max( value, min ), max );

	  }

	  limitPosition( position ) {

	    return Math.min( Math.max( position, 0 ), this.track.offsetWidth );

	  }

	  percentsFromValue( value ) {

	    return ( value - this.min ) / ( this.max - this.min );

	  }

	  valueFromPosition( position ) {

	    return this.min + ( this.max - this.min ) * ( position / this.track.offsetWidth );

	  }

	  positionFromValue( value ) {

	    return this.percentsFromValue( value ) * this.track.offsetWidth;

	  }

	  setHandlePosition() {

	    this.handle.style.left = this.percentsFromValue( this.value ) * 100 + '%';

	  }

	}

	class Preferences {

	  constructor( game ) {

	    this.game = game;

	  }

	  init() {

	    this.ranges = {

	      size: new Range( 'size', {
	        value: this.game.cube.size,
	        range: [ 2, 5 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.cube.size = value;

	          this.game.preferences.ranges.scramble.list.forEach( ( item, i ) => {

	            item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

	          } );

	        },
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      flip: new Range( 'flip', {
	        value: this.game.controls.flipConfig,
	        range: [ 0, 2 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.controls.flipConfig = value;

	        },
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      scramble: new Range( 'scramble', {
	        value: this.game.scrambler.dificulty,
	        range: [ 0, 2 ],
	        step: 1,
	        onUpdate: value => {

	          this.game.scrambler.dificulty = value;

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      fov: new Range( 'fov', {
	        value: this.game.world.fov,
	        range: [ 2, 45 ],
	        onUpdate: value => {

	          this.game.world.fov = value;
	          this.game.world.resize();

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      theme: new Range( 'theme', {
	        value: { cube: 0, erno: 1, dust: 2, camo: 3, rain: 4 }[ this.game.themes.theme ],
	        range: [ 0, 4 ],
	        step: 1,
	        onUpdate: value => {

	          const theme = [ 'cube', 'erno', 'dust', 'camo', 'rain' ][ value ];
	          this.game.themes.setTheme( theme );

	        },
	        onComplete: () => this.game.storage.savePreferences()
	      } ),

	      hue: new Range( 'hue', {
	        value: 0,
	        range: [ 0, 360 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      saturation: new Range( 'saturation', {
	        value: 100,
	        range: [ 0, 100 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	      lightness: new Range( 'lightness', {
	        value: 50,
	        range: [ 0, 100 ],
	        onUpdate: value => this.game.themeEditor.updateHSL(),
	        onComplete: () => this.game.storage.savePreferences(),
	      } ),

	    };

	    this.ranges.scramble.list.forEach( ( item, i ) => {

	      item.innerHTML = this.game.scrambler.scrambleLength[ this.game.cube.size ][ i ];

	    } );
	    
	  }

	}

	class Confetti {

	  constructor( game ) {

	    this.game = game;
	    this.started = 0;

	    this.options = {
	      speed: { min: 0.0011, max: 0.0022 },
	      revolution: { min: 0.01, max: 0.05 },
	      size: { min: 0.1, max: 0.15 },
	      colors: [ 0x41aac8, 0x82ca38, 0xffef48, 0xef3923, 0xff8c0a ],
	    };

	    this.geometry = new THREE.PlaneGeometry( 1, 1 );
	    this.material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );

	    this.holders = [
	      new ConfettiStage( this.game, this, 1, 20 ),
	      new ConfettiStage( this.game, this, -1, 30 ),
	    ];

	  }

	  start() {

	    if ( this.started > 0 ) return;

	    this.holders.forEach( holder => {

	      this.game.world.scene.add( holder.holder );
	      holder.start();
	      this.started ++;

	    } );

	  }

	  stop() {

	    if ( this.started == 0 ) return;

	    this.holders.forEach( holder => {

	      holder.stop( () => {

	        this.game.world.scene.remove( holder.holder );
	        this.started --;

	      } );

	    } );

	  }

	  updateColors( colors ) {

	    this.holders.forEach( holder => {

	      holder.options.colors.forEach( ( color, index ) => {

	        holder.options.colors[ index ] = colors[ [ 'D', 'F', 'R', 'B', 'L' ][ index ] ];

	      } );

	    } );

	  }

	}

	class ConfettiStage extends Animation {

	  constructor( game, parent, distance, count ) {

	    super( false );

	    this.game = game;
	    this.parent = parent;

	    this.distanceFromCube = distance;

	    this.count = count;
	    this.particles = [];

	    this.holder = new THREE.Object3D();
	    this.holder.rotation.copy( this.game.world.camera.rotation );

	    this.object = new THREE.Object3D();
	    this.holder.add( this.object );

	    this.resizeViewport = this.resizeViewport.bind( this );
	    this.game.world.onResize.push( this.resizeViewport );
	    this.resizeViewport();    

	    this.geometry = this.parent.geometry;
	    this.material = this.parent.material;

	    this.options = this.parent.options;

	    let i = this.count;
	    while ( i-- ) this.particles.push( new Particle( this ) );

	  }

	  start() {

	    this.time = performance.now();
	    this.playing = true;

	    let i = this.count;
	    while ( i-- ) this.particles[ i ].reset();

	    super.start();

	  }

	  stop( callback ) {

	    this.playing = false;
	    this.completed = 0;
	    this.callback = callback;

	  }

	  reset() {

	    super.stop();

	    this.callback();

	  }

	  update() {

	    const now = performance.now();
	    const delta = now - this.time;
	    this.time = now;

	    let i = this.count;

	    while ( i-- )
	      if ( ! this.particles[ i ].completed ) this.particles[ i ].update( delta );

	    if ( ! this.playing && this.completed == this.count ) this.reset();

	  }

	  resizeViewport() {

	    const fovRad = this.game.world.camera.fov * THREE.Math.DEG2RAD;

	    this.height = 2 * Math.tan( fovRad / 2 ) * ( this.game.world.camera.position.length() - this.distanceFromCube );
	    this.width = this.height * this.game.world.camera.aspect;

	    const scale = 1 / this.game.transition.data.cameraZoom;

	    this.width *= scale;
	    this.height *= scale;

	    this.object.position.z = this.distanceFromCube;
	    this.object.position.y = this.height / 2;

	  }
	  
	}

	class Particle {

	  constructor( confetti ) {

	    this.confetti = confetti;
	    this.options = this.confetti.options;

	    this.velocity = new THREE.Vector3();
	    this.force = new THREE.Vector3();

	    this.mesh = new THREE.Mesh( this.confetti.geometry, this.confetti.material.clone() );
	    this.confetti.object.add( this.mesh );

	    this.size = THREE.Math.randFloat( this.options.size.min, this.options.size.max );
	    this.mesh.scale.set( this.size, this.size, this.size );

	    return this;

	  }

	  reset( randomHeight = true ) {

	    this.completed = false;

	    this.color = new THREE.Color( this.options.colors[ Math.floor( Math.random() * this.options.colors.length ) ] );
	    this.mesh.material.color.set( this.color );

	    this.speed = THREE.Math.randFloat( this.options.speed.min, this.options.speed.max ) * -1;
	    this.mesh.position.x = THREE.Math.randFloat( - this.confetti.width / 2, this.confetti.width / 2 );
	    this.mesh.position.y = ( randomHeight )
	      ? THREE.Math.randFloat( this.size, this.confetti.height + this.size )
	      : this.size;

	    this.revolutionSpeed = THREE.Math.randFloat( this.options.revolution.min, this.options.revolution.max );
	    this.revolutionAxis = [ 'x', 'y', 'z' ][ Math.floor( Math.random() * 3 ) ];
	    this.mesh.rotation.set( Math.random() * Math.PI / 3, Math.random() * Math.PI / 3, Math.random() * Math.PI / 3 );

	  }

	  stop() {

	    this.completed = true;
	    this.confetti.completed ++;

	  }

	  update( delta ) {

	    this.mesh.position.y += this.speed * delta;
	    this.mesh.rotation[ this.revolutionAxis ] += this.revolutionSpeed;

	    if ( this.mesh.position.y < - this.confetti.height - this.size )
	      ( this.confetti.playing ) ? this.reset( false ) : this.stop();

	  }

	}

	class Scores {

	  constructor( game ) {

	    this.game = game;

	    this.data = {
	      2: {
	        scores: [],
	        solves: 0,
	        best: 0,
	        worst: 0,
	      },
	      3: {
	        scores: [],
	        solves: 0,
	        best: 0,
	        worst: 0,
	      },
	      4: {
	        scores: [],
	        solves: 0,
	        best: 0,
	        worst: 0,
	      },
	      5: {
	        scores: [],
	        solves: 0,
	        best: 0,
	        worst: 0,
	      }
	    };

	  }

	  addScore( time ) {

	    const data = this.data[ this.game.cube.sizeGenerated ];

	    data.scores.push( time );
	    data.solves++;

	    if ( data.scores.lenght > 100 ) data.scores.shift();

	    let bestTime = false;    

	    if ( time < data.best || data.best === 0 ) {

	      data.best = time;
	      bestTime = true;

	    }

	    if ( time > data.worst ) data.worst = time;

	    this.game.storage.saveScores();

	    return bestTime;

	  }

	  calcStats() {

	    const s = this.game.cube.sizeGenerated;
	    const data = this.data[ s ];

	    this.setStat( 'cube-size', `${s}<i>x</i>${s}<i>x</i>${s}` );
	    this.setStat( 'total-solves', data.solves );
	    this.setStat( 'best-time', this.convertTime( data.best ) );
	    this.setStat( 'worst-time', this.convertTime( data.worst ) );
	    this.setStat( 'average-5', this.getAverage( 5 ) );
	    this.setStat( 'average-12', this.getAverage( 12 ) );
	    this.setStat( 'average-25', this.getAverage( 25 ) );

	  }

	  setStat( name, value ) {

	    if ( value === 0 ) value = '-';

	    this.game.dom.stats.querySelector( `.stats[name="${name}"] b` ).innerHTML = value;

	  }

	  getAverage( count ) {

	    const data = this.data[ this.game.cube.sizeGenerated ];

	    if ( data.scores.length < count ) return 0;

	    return this.convertTime( data.scores.slice( -count ).reduce( ( a, b ) => a + b, 0 ) / count );

	  }

	  convertTime( time ) {

	    if ( time <= 0 ) return 0;

	    const seconds = parseInt( ( time / 1000 ) % 60 );
	    const minutes = parseInt( ( time / ( 1000 * 60 ) ) );

	    return minutes + ':' + ( seconds < 10 ? '0' : '' ) + seconds;

	  }

	}

	class Storage {

	  constructor( game ) {

	    this.game = game;

	    const userVersion = localStorage.getItem( 'theCube_version' );

	    if ( ! userVersion || userVersion !== window.gameVersion ) {

	      this.clearGame();
	      this.clearPreferences();
	      this.migrateScores();
	      // localStorage.setItem( 'theCube_version', window.gameVersion );

	    }

	  }

	  init() {

	    this.loadPreferences();
	    this.loadScores();

	  }

	  loadGame() {
	    return;

	  }

	  saveGame() {

	    return;

	  }

	  clearGame() {

	    localStorage.removeItem( 'theCube_playing' );
	    localStorage.removeItem( 'theCube_savedState' );
	    localStorage.removeItem( 'theCube_time' );

	  }

	  loadScores() {
	    return;

	  }

	  saveScores() {

	    return;

	  }

	  clearScores() {

	    return;

	  }

	  migrateScores() {
	    return;

	  }

	  loadPreferences() {

	    try {

	      const preferences = JSON.parse( localStorage.getItem( 'theCube_preferences' ) );

	      if ( ! preferences ) throw new Error();

	      this.game.cube.size = parseInt( preferences.cubeSize );
	      this.game.controls.flipConfig = parseInt( preferences.flipConfig );
	      this.game.scrambler.dificulty = parseInt( preferences.dificulty );

	      this.game.world.fov = parseFloat( preferences.fov );
	      this.game.world.resize();

	      this.game.themes.colors = preferences.colors;
	      this.game.themes.setTheme( preferences.theme );

	      return true;

	    } catch (e) {

	      this.game.cube.size = 3;
	      this.game.controls.flipConfig = 0;
	      this.game.scrambler.dificulty = 1;

	      this.game.world.fov = 10;
	      this.game.world.resize();

	      this.game.themes.setTheme( 'cube' );

	      this.savePreferences();

	      return false;

	    }

	  }

	  savePreferences() {

	    const preferences = {
	      cubeSize: this.game.cube.size,
	      flipConfig: this.game.controls.flipConfig,
	      dificulty: this.game.scrambler.dificulty,
	      fov: this.game.world.fov,
	      theme: this.game.themes.theme,
	      colors: this.game.themes.colors,
	    };

	    localStorage.setItem( 'theCube_preferences', JSON.stringify( preferences ) );

	  }

	  clearPreferences() {

	    localStorage.removeItem( 'theCube_preferences' );

	  }

	}

	class Themes {

	  constructor( game ) {

	    this.game = game;
	    this.theme = null;

	    this.defaults = {
	      cube: {
	        U: 0xfff7ff, // white
	        D: 0xffef48, // yellow
	        F: 0xef3923, // red
	        R: 0x41aac8, // blue
	        B: 0xff8c0a, // orange
	        L: 0x82ca38, // green
	        P: 0x08101a, // piece
	        G: 0xd1d5db, // background
	      },
	      erno: {
	        U: 0xffffff,
	        D: 0xffd500,
	        F: 0xc41e3a,
	        R: 0x0051ba,
	        B: 0xff5800,
	        L: 0x009e60,
	        P: 0x08101a,
	        G: 0x8abdff,
	      },
	      dust: {
	        U: 0xfff6eb,
	        D: 0xe7c48d,
	        F: 0x8f253e,
	        R: 0x607e69,
	        B: 0xbe6f62,
	        L: 0x849f5d,
	        P: 0x08101a,
	        G: 0xE7C48D,
	      },
	      camo: {
	        U: 0xfff6eb,
	        D: 0xbfb672,
	        F: 0x37241c,
	        R: 0x718456,
	        B: 0x805831,
	        L: 0x37431d,
	        P: 0x08101a,
	        G: 0xBFB672,
	      },
	      rain: {
	        U: 0xfafaff,
	        D: 0xedb92d,
	        F: 0xce2135,
	        R: 0x449a89,
	        B: 0xec582f,
	        L: 0xa3a947,
	        P: 0x08101a,
	        G: 0x87b9ac,
	      },
	    };

	    this.colors = JSON.parse( JSON.stringify( this.defaults ) );

	  }

	  getColors() {

	    return this.colors[ this.theme ];

	  }

	  setTheme( theme = false, force = false ) {

	    if ( theme === this.theme && force === false ) return;
	    if ( theme !== false ) this.theme = theme;

	    const colors = this.getColors();

	    this.game.dom.prefs.querySelectorAll( '.range__handle div' ).forEach( range => {

	      range.style.background = '#' + colors.R.toString(16).padStart(6, '0');

	    } );

	    this.game.cube.updateColors( colors );

	    this.game.confetti.updateColors( colors );

	    this.game.dom.back.style.background = '#' + colors.G.toString(16).padStart(6, '0');

	  }

	}

	class ThemeEditor {

	  constructor( game ) {

	    this.game = game;

	    this.editColor = 'R';

	    this.getPieceColor = this.getPieceColor.bind( this );

	  }

	  colorFromHSL( h, s, l ) {

	    h = Math.round( h );
	    s = Math.round( s );
	    l = Math.round( l );

	    return new THREE.Color( `hsl(${h}, ${s}%, ${l}%)` );

	  }

	  setHSL( color = null, animate = false ) {

	    this.editColor = ( color === null) ? 'R' : color;

	    const hsl = new THREE.Color( this.game.themes.getColors()[ this.editColor ] );

	    const { h, s, l } = hsl.getHSL( hsl );
	    const { hue, saturation, lightness } = this.game.preferences.ranges;

	    if ( animate ) {

	      const ho = hue.value / 360;
	      const so = saturation.value / 100;
	      const lo = lightness.value / 100;

	      const colorOld = this.colorFromHSL( hue.value, saturation.value, lightness.value );

	      if ( this.tweenHSL ) this.tweenHSL.stop();

	      this.tweenHSL = new Tween( {
	        duration: 200,
	        easing: Easing.Sine.Out(),
	        onUpdate: tween => {

	          hue.setValue( ( ho + ( h - ho ) * tween.value ) * 360 );
	          saturation.setValue( ( so + ( s - so ) * tween.value ) * 100 );
	          lightness.setValue( ( lo + ( l - lo ) * tween.value ) * 100 );

	          const colorTween = colorOld.clone().lerp( hsl, tween.value );

	          const colorTweenStyle = colorTween.getStyle();
	          const colorTweenHex = colorTween.getHSL( colorTween );

	          hue.handle.style.color = colorTweenStyle;
	          saturation.handle.style.color = colorTweenStyle;
	          lightness.handle.style.color = colorTweenStyle;

	          saturation.track.style.color =
	            this.colorFromHSL( colorTweenHex.h * 360, 100, 50 ).getStyle();
	          lightness.track.style.color =
	            this.colorFromHSL( colorTweenHex.h * 360, colorTweenHex.s * 100, 50 ).getStyle();

	          this.game.dom.theme.style.display = 'none';
	          this.game.dom.theme.offsetHeight;
	          this.game.dom.theme.style.display = '';

	        },
	        onComplete: () => {

	          this.updateHSL();
	          this.game.storage.savePreferences();

	        },
	      } );

	    } else {

	      hue.setValue( h * 360 );
	      saturation.setValue( s * 100 );
	      lightness.setValue( l * 100 );

	      this.updateHSL();
	      this.game.storage.savePreferences();

	    }

	  }

	  updateHSL() {

	    const { hue, saturation, lightness } = this.game.preferences.ranges;

	    const h = hue.value;
	    const s = saturation.value;
	    const l = lightness.value;

	    const color = this.colorFromHSL( h, s, l ).getStyle();

	    hue.handle.style.color = color;
	    saturation.handle.style.color = color;
	    lightness.handle.style.color = color;

	    saturation.track.style.color = this.colorFromHSL( h, 100, 50 ).getStyle();
	    lightness.track.style.color = this.colorFromHSL( h, s, 50 ).getStyle();

	    this.game.dom.theme.style.display = 'none';
	    this.game.dom.theme.offsetHeight;
	    this.game.dom.theme.style.display = '';

	    const theme = this.game.themes.theme;

	    this.game.themes.colors[ theme ][ this.editColor ] = this.colorFromHSL( h, s, l ).getHex();
	    this.game.themes.setTheme();

	  }

	  colorPicker( enable ) {

	    if ( enable ) {

	      this.game.dom.game.addEventListener( 'click', this.getPieceColor, false );

	    } else {

	      this.game.dom.game.removeEventListener( 'click', this.getPieceColor, false );

	    }

	  }

	  getPieceColor( event ) {

	    const clickEvent = event.touches
	      ? ( event.touches[ 0 ] || event.changedTouches[ 0 ] )
	      : event;

	    const clickPosition = new THREE.Vector2( clickEvent.pageX, clickEvent.pageY );

	    let edgeIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.edges, true );
	    let pieceIntersect = this.game.controls.getIntersect( clickPosition, this.game.cube.cubes, true );

	    if ( edgeIntersect !== false ) {

	      const edge = edgeIntersect.object;

	      const position = edge.parent
	        .localToWorld( edge.position.clone() )
	        .sub( this.game.cube.object.position )
	        .sub( this.game.cube.animator.position );

	      const mainAxis = this.game.controls.getMainAxis( position );
	      if ( position.multiplyScalar( 2 ).round()[ mainAxis ] < 1 ) edgeIntersect = false;

	    }

	    const name = edgeIntersect ? edgeIntersect.object.name : pieceIntersect ? 'P' : 'G';

	    this.setHSL( name, true );

	  }

	  resetTheme() {

	    this.game.themes.colors[ this.game.themes.theme ] =
	      JSON.parse( JSON.stringify( this.game.themes.defaults[ this.game.themes.theme ] ) );

	    this.game.themes.setTheme();

	    this.setHSL( this.editColor, true );

	  }

	}

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

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var index_es6$1 = {exports: {}};

	var index_es6 = index_es6$1.exports;

	var hasRequiredIndex_es6;

	function requireIndex_es6 () {
		if (hasRequiredIndex_es6) return index_es6$1.exports;
		hasRequiredIndex_es6 = 1;
		(function (module, exports) {
			(function webpackUniversalModuleDefinition(root, factory) {
				module.exports = factory();
			})(index_es6, function() {
			return /******/ (function(modules) { // webpackBootstrap
			/******/ 	// The module cache
			/******/ 	var installedModules = {};
			/******/
			/******/ 	// The require function
			/******/ 	function __webpack_require__(moduleId) {
			/******/
			/******/ 		// Check if module is in cache
			/******/ 		if(installedModules[moduleId]) {
			/******/ 			return installedModules[moduleId].exports;
			/******/ 		}
			/******/ 		// Create a new module (and put it into the cache)
			/******/ 		var module = installedModules[moduleId] = {
			/******/ 			i: moduleId,
			/******/ 			l: false,
			/******/ 			exports: {}
			/******/ 		};
			/******/
			/******/ 		// Execute the module function
			/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
			/******/
			/******/ 		// Flag the module as loaded
			/******/ 		module.l = true;
			/******/
			/******/ 		// Return the exports of the module
			/******/ 		return module.exports;
			/******/ 	}
			/******/
			/******/
			/******/ 	// expose the modules object (__webpack_modules__)
			/******/ 	__webpack_require__.m = modules;
			/******/
			/******/ 	// expose the module cache
			/******/ 	__webpack_require__.c = installedModules;
			/******/
			/******/ 	// identity function for calling harmony imports with the correct context
			/******/ 	__webpack_require__.i = function(value) { return value; };
			/******/
			/******/ 	// define getter function for harmony exports
			/******/ 	__webpack_require__.d = function(exports, name, getter) {
			/******/ 		if(!__webpack_require__.o(exports, name)) {
			/******/ 			Object.defineProperty(exports, name, {
			/******/ 				configurable: false,
			/******/ 				enumerable: true,
			/******/ 				get: getter
			/******/ 			});
			/******/ 		}
			/******/ 	};
			/******/
			/******/ 	// getDefaultExport function for compatibility with non-harmony modules
			/******/ 	__webpack_require__.n = function(module) {
			/******/ 		var getter = module && module.__esModule ?
			/******/ 			function getDefault() { return module['default']; } :
			/******/ 			function getModuleExports() { return module; };
			/******/ 		__webpack_require__.d(getter, 'a', getter);
			/******/ 		return getter;
			/******/ 	};
			/******/
			/******/ 	// Object.prototype.hasOwnProperty.call
			/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
			/******/
			/******/ 	// __webpack_public_path__
			/******/ 	__webpack_require__.p = "";
			/******/
			/******/ 	// Load entry module and return exports
			/******/ 	return __webpack_require__(__webpack_require__.s = 33);
			/******/ })
			/************************************************************************/
			/******/ ([
			/* 0 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_gl_vec3_cross__ = __webpack_require__(12);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_gl_vec3_cross___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_gl_vec3_cross__);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_Face__ = __webpack_require__(14);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__models_Vector__ = __webpack_require__(4);




			// maps each face with the notation for their middle moves
			const _middlesMatchingFace = {
				f: 's',
				r: 'mprime',
				u: 'eprime',
				d: 'e',
				l: 'm',
				b: 'sprime'
			};

			/**
			 * @param {string} move - The notation of a move, e.g. rPrime.
			 * @return {string}
			 */
			const getFaceOfMove = (move) => {
				if (typeof move !== 'string') {
					throw new TypeError('move must be a string');
				}

				let faceLetter = move[0].toLowerCase();

				if (faceLetter === 'f') return 'front';
				if (faceLetter === 'r') return 'right';
				if (faceLetter === 'u') return 'up';
				if (faceLetter === 'd') return 'down';
				if (faceLetter === 'l') return 'left';
				if (faceLetter === 'b') return 'back';
			};
			/* harmony export (immutable) */ __webpack_exports__["a"] = getFaceOfMove;


			/**
			 * Almost useless. Almost.
			 * @param {string} face - The string identifying a face.
			 * @return {string}
			 */
			const getMoveOfFace = (face) => {
				if (typeof face !== 'string') {
					throw new TypeError('face must be a string');
				}

				face = face.toLowerCase();

				if (!['front', 'right', 'up', 'down', 'left', 'back'].includes(face)) {
					throw new Error(`${face} is not valid face`);
				}

				return face[0];
			};
			/* harmony export (immutable) */ __webpack_exports__["f"] = getMoveOfFace;


			const getMiddleMatchingFace = (face) => {
				face = face.toLowerCase()[0];
				return _middlesMatchingFace[face];
			};
			/* harmony export (immutable) */ __webpack_exports__["g"] = getMiddleMatchingFace;


			const getFaceMatchingMiddle = (middle) => {
				middle = middle.toLowerCase();

				for (let face of Object.keys(_middlesMatchingFace)) {
					let testMiddle = _middlesMatchingFace[face];
					if (middle === testMiddle) {
						return face;
					}
				}
			};
			/* unused harmony export getFaceMatchingMiddle */


			/**
			 * @param {string|array} notations - The move notation.
			 * @param {object} options - Move options.
			 * @prop {boolean} options.upperCase - Turn all moves to upper case (i.e. no "double" moves).
			 *
			 * @return {string|array} -- whichever was initially given.
			 */
			const transformNotations = (notations, options = {}) => {
				let normalized = normalizeNotations(notations);

				if (options.upperCase) {
					normalized = normalized.map(n => n[0].toUpperCase() + n.slice(1));
				}

				if (options.orientation) {
					normalized = orientMoves(normalized, options.orientation);
				}

				if (options.reverse) {
					normalized = _reverseNotations(normalized);
				}

				return typeof notations === 'string' ? normalized.join(' ') : normalized;
			};
			/* harmony export (immutable) */ __webpack_exports__["d"] = transformNotations;


			/**
			 * @param {array|string} notations - The notations to noramlize.
			 * @return {array}
			 */
			const normalizeNotations = (notations) => {
				if (typeof notations === 'string') {
					notations = notations.split(' ');
				}

				notations = notations.filter(notation => notation !== '');

				return notations.map(notation => {
					let isPrime = notation.toLowerCase().includes('prime');
					let isDouble = notation.includes('2');

					notation = notation[0];

					if (isDouble) notation = notation[0] + '2';
					else if (isPrime) notation = notation + 'prime';

					return notation;
				});
			};
			/* harmony export (immutable) */ __webpack_exports__["h"] = normalizeNotations;


			/**
			 * Finds the direction from an origin face to a target face. The origin face
			 * will be oriented so that it becomes FRONT. An orientation object must be
			 * provided that specifies any of these faces (exclusively): TOP, RIGHT, DOWN,
			 * LEFT.
			 * If FRONT or BACK is provided along with one of those faces, it will be
			 * ignored. If FRONT or BACK is the only face provided, the orientation is
			 * ambiguous and an error will be thrown.
			 *
			 * Example:
			 * getDirectionFromFaces('back', 'up', { down: 'right' })
			 * Step 1) orient the BACK face so that it becomes FRONT.
			 * Step 2) orient the DOWN face so that it becomes RIGHT.
			 * Step 3) Find the direction from BACK (now FRONT) to UP (now LEFT).
			 * Step 4) Returns 'left'.
			 *
			 * @param {string} origin - The origin face.
			 * @param {string} target - The target face.
			 * @param {object} orientation - The object that specifies the cube orientation.
			 * @return {string|number}
			 */
			const getDirectionFromFaces = (origin, target, orientation) => {
				orientation = _toLowerCase(orientation);
				orientation = _prepOrientationForDirection(orientation, origin);

				let fromFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](origin);
				let toFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](target);

				let rotations = _getRotationsForOrientation(orientation);
				_rotateFacesByRotations([fromFace, toFace], rotations);

				let axis = new __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */](__WEBPACK_IMPORTED_MODULE_0_gl_vec3_cross___default()([], fromFace.normal(), toFace.normal())).getAxis();
				let direction = __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].getAngle(fromFace.normal(), toFace.normal());

				if (axis === 'x' && direction > 0) return 'down';
				if (axis === 'x' && direction < 0) return 'up';
				if (axis === 'y' && direction > 0) return 'right';
				if (axis === 'y' && direction < 0) return 'left';

				if (direction === 0) {
					return 'front';
				} else if (direction === Math.PI) {
					return 'back';
				}
			};
			/* harmony export (immutable) */ __webpack_exports__["c"] = getDirectionFromFaces;


			/**
			 * See `getDirectionFromFaces`. Almost identical, but instead of finding a
			 * direction from an origin face and target face, this finds a target face from
			 * an origin face and direction.
			 * @param {string} origin - The origin face.
			 * @param {string} direction - The direction.
			 * @param {object} orientation - The orientation object.
			 * @return {string}
			 */
			const getFaceFromDirection = (origin, direction, orientation) => {
				orientation = _toLowerCase(orientation);
				orientation = _prepOrientationForDirection(orientation, origin);

				let fromFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](origin);

				let rotations = _getRotationsForOrientation(orientation);
				_rotateFacesByRotations([fromFace], rotations);

				let directionFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](direction);
				let { axis, angle } = __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].getRotationFromNormals(fromFace.normal(), directionFace.normal());
				fromFace.rotate(axis, angle);

				// at this point fromFace is now the target face, but we still need to revert
				// the orientation to return the correct string
				let reversedRotations = rotations.map(rotation => __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].reverseRotation(rotation)).reverse();
				_rotateFacesByRotations([fromFace], reversedRotations);
				return fromFace.toString();
			};
			/* harmony export (immutable) */ __webpack_exports__["e"] = getFaceFromDirection;


			/**
			 * Finds a move that rotates the given face around its normal, by the angle
			 * described by normal1 -> normal2.
			 * @param {string} face - The face to rotate.
			 * @param {string} from - The origin face.
			 * @param {string} to - The target face.
			 * @return {string}
			 */
			const getRotationFromTo = (face, from, to) => {
				const rotationFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](face);
				const fromFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](from);
				const toFace = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](to);

				let rotationAxis = rotationFace.vector.getAxis();
				let [fromAxis, toAxis] = [fromFace.vector.getAxis(), toFace.vector.getAxis()];

				if ([fromAxis.toLowerCase(), toAxis.toLowerCase()].includes(rotationAxis.toLowerCase())) {
					throw new Error(`moving ${rotationFace} from ${fromFace} to ${toFace} is not possible.`);
				}

				let move = getMoveOfFace(face).toUpperCase();
				let angle = __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].getAngle(fromFace.normal(), toFace.normal());
				if (rotationFace.vector.getMagnitude() < 0) {
					angle *= -1;
				}

				if (angle === 0) {
					return '';
				} else if (Math.abs(angle) === Math.PI) {
					return `${move} ${move}`;
				} else if (angle < 0) {
					return `${move}`;
				} else if (angle > 0) {
					return `${move}Prime`;
				}
			};
			/* harmony export (immutable) */ __webpack_exports__["b"] = getRotationFromTo;


			/**
			 * Returns an array of transformed notations so that if done when the cube's
			 * orientation is default (FRONT face is FRONT, RIGHT face is RIGHT, etc.), the
			 * moves will have the same effect as performing the given notations on a cube
			 * oriented by the specified orientation.
			 *
			 * Examples:
			 * orientMoves(['R', 'U'], { front: 'front', up: 'up' })      === ['R', 'U']
			 * orientMoves(['R', 'U'], { front: 'front', down: 'right' }) === ['U', 'L']
			 * orientMoves(['R', 'U', 'LPrime', 'D'], { up: 'back', right: 'down' }) === ['D', 'B', 'UPrime', 'F']
			 *
			 * @param {array} notations - An array of notation strings.
			 * @param {object} orientation - The orientation object.
			 */
			const orientMoves = (notations, orientation) => {
				orientation = _toLowerCase(orientation);
				let rotations = _getRotationsForOrientation(orientation);
				rotations.reverse().map(rotation => __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].reverseRotation(rotation));

				return notations.map(notation => {
					let isPrime = notation.toLowerCase().includes('prime');
					let isDouble = notation.includes('2');
					let isWithMiddle = notation[0] === notation[0].toLowerCase();
					let isMiddle = ['m', 'e', 's'].includes(notation[0].toLowerCase());

					if (isDouble) {
						notation = notation.replace('2', '');
					}

					let face;

					if (isMiddle) {
						let faceStr = getFaceOfMove(getFaceMatchingMiddle(notation));
						face = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](faceStr);
					} else {
						let faceStr = getFaceOfMove(notation[0]);
						face = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](faceStr);
					}

					_rotateFacesByRotations([face], rotations);

					let newNotation; // this will always be lower case

					if (isMiddle) {
						newNotation = getMiddleMatchingFace(face.toString());
					} else {
						newNotation = face.toString()[0];
					}

					if (!isWithMiddle) newNotation = newNotation.toUpperCase();
					if (isDouble) newNotation = newNotation + '2';
					if (isPrime && !isMiddle) newNotation += 'prime';

					return newNotation;
				});
			};
			/* unused harmony export orientMoves */


			//-----------------
			// Helper functions
			//-----------------

			/**
			 * Returns an object with all keys and values lowercased. Assumes all keys and
			 * values are strings.
			 * @param {object} object - The object to map.
			 */
			function _toLowerCase(object) {
				let ret = {};
				Object.keys(object).forEach(key => {
					ret[key.toLowerCase()] = object[key].toLowerCase();
				});
				return ret;
			}

			/**
			 * This function is specificly for `getDirectionFromFaces` and
			 * `getFaceFromDirection`. It removes all keys that are either 'front' or 'back'
			 * and sets the given front face to orientation.front.
			 * @param {object} orientation - The orientation object.
			 * @param {string} front - The face to set as front.
			 */
			function _prepOrientationForDirection(orientation, front) {
				let keys = Object.keys(orientation);

				if (keys.length <= 1 && ['front', 'back'].includes(keys[0])) {
					throw new Error(`Orientation object "${orientation}" is ambiguous. Please specify one of these faces: "up", "right", "down", "left"`);
				}

				// remove "front" and "back" from provided orientation object
				let temp = orientation;
				orientation = {};

				keys.forEach(key => {
					if (['front', 'back'].includes(key)) {
						return;
					}
					orientation[key] = temp[key];
				});

				orientation.front = front.toLowerCase();

				return orientation;
			}

			/**
			 * @param {object} orientation - The orientation object.
			 * @return {array}
			 */
			function _getRotationsForOrientation(orientation) {
				if (Object.keys(orientation) <= 1) {
					throw new Error(`Orientation object "${orientation}" is ambiguous. Please specify 2 faces.`);
				}

				let keys = Object.keys(orientation);
				let origins = keys.map(key => new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](orientation[key]));
				let targets = keys.map(key => new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](key));

				// perform the first rotation, and save it
				let rotation1 = __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].getRotationFromNormals(
					origins[0].normal(),
					origins[0].orientTo(targets[0]).normal()
				);

				// perform the first rotation on the second origin face
				origins[1].rotate(rotation1.axis, rotation1.angle);

				// peform the second rotation, and save it
				let rotation2 = __WEBPACK_IMPORTED_MODULE_2__models_Vector__["a" /* Vector */].getRotationFromNormals(
					origins[1].normal(),
					origins[1].orientTo(targets[1]).normal()
				);

				// if the rotation angle is PI, there are 3 possible axes that can perform the
				// rotation. however only one axis will perform the rotation while keeping
				// the first origin face on the target. this axis is the same as the origin
				// face's normal.
				if (Math.abs(rotation2.angle) === Math.PI) {
					let rotation2Axis = new __WEBPACK_IMPORTED_MODULE_1__models_Face__["a" /* Face */](keys[0]).vector.getAxis();
					rotation2.axis = rotation2Axis;
				}

				return [rotation1, rotation2];
			}

			/**
			 * @param {array} - Array of Face objects to rotate.
			 * @param {array} - Array of rotations to apply to faces.
			 * @return {null}
			 */
			function _rotateFacesByRotations(faces, rotations) {
				for (let face of faces) {
					for (let rotation of rotations) {
						face.rotate(rotation.axis, rotation.angle);
					}
				}
			}

			/**
			 * @param {array} notations
			 * @return {array}
			 */
			function _reverseNotations(notations) {
				const reversed = [];

				for (let notation of notations) {
					let isPrime = notation.includes('prime');
					notation = isPrime ? notation[0] : notation[0] + 'prime';
					reversed.push(notation);
				}

				return typeof moves === 'string' ? reversed.join(' ') : reversed;
			}



			/***/ }),
			/* 1 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RubiksCube; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Cubie__ = __webpack_require__(6);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__algorithm_shortener__ = __webpack_require__(2);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const SOLVED_STATE = 'fffffffffrrrrrrrrruuuuuuuuudddddddddlllllllllbbbbbbbbb';

			class RubiksCube {
				/**
				 * Factory method. Returns an instance of a solved Rubiks Cube.
				 */
				static Solved() {
					return new RubiksCube(SOLVED_STATE);
				}

				/**
				 * Factory method.
				 * @param {string|array} moves
				 */
				static FromMoves(moves) {
					const cube = RubiksCube.Solved();
					cube.move(moves);
					return cube;
				}

				/**
				 * Factory method. Returns an instance of a scrambled Rubiks Cube.
				 */
				static Scrambled() {
					let cube = RubiksCube.Solved();
					let randomMoves = RubiksCube.getRandomMoves(25);
					cube.move(randomMoves);

					return cube;
				}

				/**
				 * @param {string|array} notations - The list of moves to reverse.
				 * @return {string|array} -- whichever was initially given.
				 */
				static reverseMoves(moves) {
					return RubiksCube.transformMoves(moves, { reverse: true });
				}

				/**
				 * @param {string|array} moves - The moves to transform;
				 * @param {object} options
				 * @prop {boolean} options.upperCase - Turn lowercase moves into uppercase.
				 * @prop {object} options.orientation - An object describing the orientation
				 * from which to makes the moves. See src/js/utils#orientMoves.
				 *
				 * @return {string|array} -- whichever was initially given.
				 */
				static transformMoves(moves, options = {}) {
					return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["d" /* transformNotations */])(moves, options);
				}

				static getRandomMoves(length = 25) {
					let randomMoves = [];
					let totalMoves = [
						'F',
						'Fprime',
						'R',
						'Rprime',
						'U',
						'Uprime',
						'D',
						'Dprime',
						'L',
						'Lprime',
						'B',
						'Bprime'
					];

					while (randomMoves.length < length) {
						for (let i = 0; i < length - randomMoves.length; i++) {
							let idx = ~~(Math.random() * totalMoves.length);
							randomMoves.push(totalMoves[idx]);
						}

						randomMoves = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__algorithm_shortener__["a" /* algorithmShortener */])(randomMoves).split(' ');
					}

					return randomMoves.join(' ');
				}

				/**
				 * @param {string} cubeState - The string representing the Rubik's Cube.
				 *
				 * The cube state are represented as:
				 * 'FFFFFFFFFRRRRRRRRRUUUUUUUUUDDDDDDDDDLLLLLLLLLBBBBBBBBB'
				 *
				 * where:
				 * F stands for the FRONT COLOR
				 * R stands for the RIGHT COLOR
				 * U stands for the UP COLOR
				 * D stands for the DOWN COLOR
				 * L stands for the LEFT COLOR
				 * B stands for the BACK COLOR
				 *
				 * and the faces are given in the order of:
				 * FRONT, RIGHT, UP, DOWN, LEFT, BACK
				 *
				 * The order of each color per face is ordered by starting from the top left
				 * corner and moving to the bottom right, as if reading lines of text.
				 *
				 * See this example: http://2.bp.blogspot.com/_XQ7FznWBAYE/S9Sbric1KNI/AAAAAAAAAFs/wGAb_LcSOwo/s1600/rubik.png
				 */
				constructor(cubeState) {
					if (cubeState.length !== 9 * 6) {
						throw new Error('Wrong number of colors provided');
					}

					this._notationToRotation = {
						f: { axis: 'z', mag: -1 },
						r: { axis: 'x', mag: -1 },
						u: { axis: 'y', mag: -1 },
						d: { axis: 'y', mag: 1 },
						l: { axis: 'x', mag: 1 },
						b: { axis: 'z', mag: 1 },
						m: { axis: 'x', mag: 1 },
						e: { axis: 'y', mag: 1 },
						s: { axis: 'z', mag: -1 }
					};

					this._build(cubeState);
				}

				/**
				 * Grab all the cubes on a given face, and return them in order from top left
				 * to bottom right.
				 * @param {string} face - The face to grab.
				 * @return {array}
				 */
				getFace(face) {
					if (typeof face !== 'string') {
						throw new Error(`"face" must be a string (received: ${face})`);
					}

					face = face.toLowerCase()[0];

					// The 3D position of cubies and the way they're ordered on each face
					// do not play nicely. Below is a shitty way to reconcile the two.
					// The way the cubies are sorted depends on the row and column they
					// occupy on their face. Cubies on a higher row will have a lower sorting
					// index, but rows are not always denoted by cubies' y position, and
					// "higher rows" do not always mean "higher axis values".

					let row, col, rowOrder, colOrder;
					let cubies;

					// grab correct cubies
					if (face === 'f') {
						[row, col, rowOrder, colOrder] = ['Y', 'X', -1, 1];
						cubies = this._cubies.filter(cubie => cubie.getZ() === 1);
					} else if (face === 'r') {
						[row, col, rowOrder, colOrder] = ['Y', 'Z', -1, -1];
						cubies = this._cubies.filter(cubie => cubie.getX() === 1);
					} else if (face === 'u') {
						[row, col, rowOrder, colOrder] = ['Z', 'X', 1, 1];
						cubies = this._cubies.filter(cubie => cubie.getY() === 1);
					} else if (face === 'd') {
						[row, col, rowOrder, colOrder] = ['Z', 'X', -1, 1];
						cubies = this._cubies.filter(cubie => cubie.getY() === -1);
					} else if (face === 'l') {
						[row, col, rowOrder, colOrder] = ['Y', 'Z', -1, 1];
						cubies = this._cubies.filter(cubie => cubie.getX() === -1);
					} else if (face === 'b') {
						[row, col, rowOrder, colOrder] = ['Y', 'X', -1, -1];
						cubies = this._cubies.filter(cubie => cubie.getZ() === -1);
					} else if (['m', 'e', 's'].includes(face)) {
						return this._getMiddleCubiesForMove(face);
					}

					// order cubies from top left to bottom right
					return cubies.sort((first, second) => {
						let firstCubieRow = first[`get${row}`]() * rowOrder;
						let firstCubieCol = first[`get${col}`]() * colOrder;

						let secondCubieRow = second[`get${row}`]() * rowOrder;
						let secondCubieCol = second[`get${col}`]() * colOrder;

						if (firstCubieRow < secondCubieRow) {
							return -1;
						} else if (firstCubieRow > secondCubieRow) {
							return 1;
						} else {
							return firstCubieCol < secondCubieCol ? -1 : 1;
						}
					});
				}

				/**
				 * @param {array} faces - The list of faces the cubie belongs on.
				 */
				getCubie(faces) {
					return this._cubies.find(cubie => {
						if (faces.length != cubie.faces().length) {
							return false;
						}

						for (let face of faces) {
							if (!cubie.faces().includes(face)) {
								return false;
							}
						}

						return true;
					});
				}

				/**
				 * Finds and returns all cubies with three colors.
				 * @return {array}
				 */
				corners() {
					return this._cubies.filter(cubie => cubie.isCorner());
				}

				/**
				 * Finds and returns all cubies with two colors.
				 * @return {array}
				 */
				edges() {
					return this._cubies.filter(cubie => cubie.isEdge());
				}

				/**
				 * Finds and returns all cubies with one color.
				 * @return {array}
				 */
				middles() {
					return this._cubies.filter(cubie => cubie.isMiddle());
				}

				/**
				 * Gets the rotation axis and magnitude of rotation based on notation.
				 * Then finds all cubes on the correct face, and rotates them around the
				 * rotation axis.
				 * @param {string|array} notations - The move notation.
				 * @param {object} options - Move options.
				 * @prop {boolean} options.upperCase - Turn all moves to upper case (i.e. no "double" moves).
				 */
				move(notations, options = {}) {
					if (typeof notations === 'string') {
						notations = notations.split(' ');
					}

					notations = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["d" /* transformNotations */])(notations, options);

					for (let notation of notations) {
						let move = notation[0];

						if (!move) {
							continue;
						}

						let isPrime = notation.toLowerCase().includes('prime');
						let isWithMiddle = move === move.toLowerCase();
						let isDoubleMove  = notation.includes('2');

						let { axis, mag } = this._getRotationForFace(move);
						let cubesToRotate = this.getFace(move);

						if (isPrime) mag *= -1;
						if (isDoubleMove) mag *= 2;

						if (isWithMiddle) {
							let middleMove = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["g" /* getMiddleMatchingFace */])(move);
							let middleCubies = this._getMiddleCubiesForMove(middleMove);
							cubesToRotate = [...cubesToRotate, ...middleCubies];
						}

						for (let cubie of cubesToRotate) {
							cubie.rotate(axis, mag);
						}
					}
				}

				isSolved() {
					return this.toString() === SOLVED_STATE;
				}

				toString() {
					let cubeState = '';

					let faces = ['front', 'right', 'up', 'down', 'left', 'back'];
					for (let face of faces) {
						let cubies = this.getFace(face);
						for (let cubie of cubies) {
							cubeState += cubie.getColorOfFace(face);
						}
					}

					return cubeState;
				}

				clone() {
					return new RubiksCube(this.toString());
				}

				/**
				 * Create a "virtual" cube, with individual "cubies" having a 3D coordinate
				 * position and 1 or more colors attached to them.
				 */
				_build(cubeState) {
					this._cubies = [];
					this._populateCube();

					let parsedColors = this._parseColors(cubeState);

					for (let face of Object.keys(parsedColors)) {
						let colors = parsedColors[face];
						this._colorFace(face, colors);
					}
				}

				/**
				 * Populates the "virtual" cube with 26 "empty" cubies by their position.
				 * @return {null}
				 */
				_populateCube() {
					for (let x = -1; x <= 1; x++) {
						for (let y = -1; y <= 1; y++) {
							for (let z = -1; z <= 1; z++) {
								// no cubie in the center of the rubik's cube
								if (x === 0 && y === 0 && z === 0) {
									continue;
								}

								let cubie = new __WEBPACK_IMPORTED_MODULE_0__Cubie__["a" /* Cubie */]({ position: [x, y, z] });
								this._cubies.push(cubie);
							}
						}
					}
				}

				/**
				 * @return {object} - A map with faces for keys and colors for values
				 */
				_parseColors(cubeState) {
					let faceColors = {
						front: [],
						right: [],
						up: [],
						down: [],
						left: [],
						back: []
					};

					let currentFace;

					for (let i = 0; i < cubeState.length; i++) {
						let color = cubeState[i];

						if (i < 9) {
							currentFace = 'front';
						} else if (i < 9 * 2) {
							currentFace = 'right';
						} else if (i < 9 * 3) {
							currentFace = 'up';
						} else if (i < 9 * 4) {
							currentFace = 'down';
						} else if (i < 9 * 5) {
							currentFace = 'left';
						} else {
							currentFace = 'back';
						}

						faceColors[currentFace].push(color);
					}

					return faceColors;
				}

				/**
				 * @param {array} face - An array of the cubies on the given face.
				 * @param {array} colors - An array of the colors on the given face.
				 */
				_colorFace(face, colors) {
					let cubiesToColor = this.getFace(face);
					for (let i = 0; i < colors.length; i++) {
						cubiesToColor[i].colorFace(face, colors[i]);
					}
				}

				/**
				 * @return {object} - The the rotation axis and magnitude for the given face.
				 */
				_getRotationForFace(face) {
					if (typeof face !== 'string') {
						throw new Error(`"face" must be a string (received: ${face})`);
					}

					face = face.toLowerCase();

					return {
						axis: this._notationToRotation[face].axis,
						mag: this._notationToRotation[face].mag * Math.PI / 2
					};
				}

				_getMiddleCubiesForMove(move) {
					move = move[0].toLowerCase();

					let nonMiddles;
					if (move === 'm') {
						nonMiddles = ['left', 'right'];
					} else if (move === 'e') {
						nonMiddles = ['up', 'down'];
					} else if (move === 's') {
						nonMiddles = ['front', 'back'];
					}

					return this._cubies.filter(cubie => {
						return !cubie.hasFace(nonMiddles[0]) && !cubie.hasFace(nonMiddles[1]);
					});
				}
			}




			/***/ }),
			/* 2 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return algorithmShortener; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_array_element_combiner__ = __webpack_require__(19);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_array_element_combiner___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_array_element_combiner__);


			const parallelMoves = {
				F: 'B',
				R: 'L',
				U: 'D'
			};

			/**
			 * @param {array|string} notations - The array of move notations.
			 * @return {string}
			 */
			const algorithmShortener = (notations) => {
				if (typeof notations === 'string') {
					notations = notations.split(' ');
				}

				const options = {
					compare(a, b) {
						return a[0] === b[0];
					},
					combine(a, b) {
						const aDir = a.includes('2') ? 2 : (a.includes('prime') ? -1 : 1);
						const bDir = b.includes('2') ? 2 : (b.includes('prime') ? -1 : 1);

						let totalDir = aDir + bDir;

						if (totalDir === 4) totalDir = 0;
						if (totalDir === -2) totalDir = 2;
						if (totalDir === 3) totalDir = -1;

						if (totalDir === 0) {
							return '';
						}

						let dirString = totalDir === 2 ? '2' : (totalDir === -1 ? 'prime' : '');

						return `${a[0]}${dirString}`;
					},
					cancel(value) {
						return value === '';
					},
					ignore(a, b) {
						return (parallelMoves[a[0]] === b[0] || parallelMoves[b[0]] === a[0]);
					}
				};

				return __WEBPACK_IMPORTED_MODULE_0_array_element_combiner___default()(notations, options).join(' ');
			};




			/***/ }),
			/* 3 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BaseSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils___ = __webpack_require__(0);



			class BaseSolver {
				/**
				 * Solves the first step following the Fridrich Method: the cross. Solves the
				 * cross on the UP face by default.
				 *
				 * @param {string|RubiksCube} rubiksCube - This can either be a 54-character
				 * long string representing the cube state (in this case it will have to
				 * "build" another rubik's Cube), or an already built RubiksCube object.
				 */
				constructor(rubiksCube, options = {}) {
					this.cube = typeof rubiksCube === 'string' ? new __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */](rubiksCube) : rubiksCube;
					this.options = options;

					this.partition = {};
					this.partitions = [];
					this.totalMoves = [];
					this._afterEachCallbacks = [];
				}

				/**
				 * @param {string|array} notation - A string of move(s) to execute and store.
				 * @param {object} options - The options to pass to RubiksCube#move.
				 */
				move(notations, options) {
					if (typeof notations === 'string') {
						notations = notations.split(' ');
					}

					this.cube.move(notations, options);

					// this step is also in RubiksCube#move, but it is important we do it here
					// as well. The notations need to be saved to the partition correctly.
					notations = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils___["d" /* transformNotations */])(notations, options);

					for (let notation of notations) {
						this.totalMoves.push(notation);
					}
				}

				afterEach(callback) {
					this._afterEachCallbacks.push(callback);
				}

				/**
				 * @param {...*} callbackArgs - The arguments to call the function with.
				 */
				_triggerAfterEach(...callbackArgs) {
					this._afterEachCallbacks.forEach(fn => fn(...callbackArgs));
				}

				/**
				 * Solves the edge and/or corner and returns information about the state
				 * about them right before they are solved. It's important to construct the
				 * object in steps for debugging, so that we can still have access to e.g.
				 * the case number if the solve method fails.
				 */
				_solve(cubies = {}) {

					this.partition = {};
					this.partition.cubies = cubies;

					let { corner, edge } = cubies;

					this.partition.caseNumber = this._getCaseNumber({ corner, edge });

					this._solveCase(this.partition.caseNumber, { corner, edge });
					this.partition.moves = this.totalMoves;

					this.totalMoves = [];

					if (!this._overrideAfterEach) {
						this._triggerAfterEach(this.partition, this.phase);
					}

					return this.partition;
				}

				_solveCase(caseNumber, cubies = {}) {
					let { corner, edge } = cubies;
					this[`_solveCase${caseNumber}`]({ corner, edge });
				}
			}




			/***/ }),
			/* 4 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Vector; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_gl_vec3_angle__ = __webpack_require__(22);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_gl_vec3_angle___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_gl_vec3_angle__);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_gl_vec3_cross__ = __webpack_require__(12);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_gl_vec3_cross___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_gl_vec3_cross__);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_gl_vec3_rotateX__ = __webpack_require__(26);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_gl_vec3_rotateX___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_gl_vec3_rotateX__);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_gl_vec3_rotateY__ = __webpack_require__(27);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_gl_vec3_rotateY___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_gl_vec3_rotateY__);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_gl_vec3_rotateZ__ = __webpack_require__(28);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_gl_vec3_rotateZ___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_gl_vec3_rotateZ__);






			const rotate = {
				x: __WEBPACK_IMPORTED_MODULE_2_gl_vec3_rotateX___default.a,
				y: __WEBPACK_IMPORTED_MODULE_3_gl_vec3_rotateY___default.a,
				z: __WEBPACK_IMPORTED_MODULE_4_gl_vec3_rotateZ___default.a
			};

			class Vector {
				/**
				 * Factory method.
				 * @param {string} vector - Space-deliminated x, y, and z values.
				 * @return {Vector}
				 */
				static FromString(vector) {
					return new Vector(vector.split(' ').map(value => parseInt(value)));
				}

				/**
				 * @param {array} vector1 - Vector 1.
				 * @param {array} vector2 - Vector 2.
				 * @return {boolean}
				 */
				static areEqual(vector1, vector2) {
					return vector1[0] === vector2[0] && vector1[1] === vector2[1] && vector1[2] === vector2[2];
				}

				/**
				 * Helper method. gl-vec3's angle function always returns positive but in many
				 * cases we want the angle in the direction from one vector to another. To get
				 * the sign of the angle, cross the two vectors and determine the direction the
				 * crossed vector, um, directs in. For example, the vector [0, -1, 0] would
				 * shoot negatively along the y-axis.
				 *
				 * @param {array} v1 - Vector 1.
				 * @param {array} v2 - Vector 2.
				 * @return {number}
				 */
				static getAngle(v1, v2) {
					let _angle = __WEBPACK_IMPORTED_MODULE_0_gl_vec3_angle___default()(v1, v2);
					let crossVector = __WEBPACK_IMPORTED_MODULE_1_gl_vec3_cross___default()([], v1, v2);
					let sign = new Vector(crossVector).getMagnitude();

					return sign ? _angle * sign : _angle;
				}

				/**
				 * Finds the rotation axis and angle to get from one normal to another.
				 * @param {array} normal1 - The from normal.
				 * @param {array} normal2 - The to normal.
				 * @return {object} - Stores the rotation axis and angle
				 */
				static getRotationFromNormals(normal1, normal2) {
					let axis = new Vector(__WEBPACK_IMPORTED_MODULE_1_gl_vec3_cross___default()([], normal1, normal2)).getAxis();
					let angle = Vector.getAngle(normal1, normal2);

					// when normal1 is equal to or opposite from normal2, it means 2 things: 1)
					// the cross axis is undefined and 2) the angle is either 0 or PI. This
					// means that rotating around the axis parallel to normal1 will not result
					// in any change, while rotating around either of the other two will work
					// properly.
					if (!axis) {
						let axes = ['x', 'y', 'z'];
						axes.splice(axes.indexOf(new Vector(normal1).getAxis()), 1);
						axis = axes[0];
					}

					return { axis, angle };
				}

				/**
				 * @param {object} rotation - The rotation to reverse.
				 * @return {object}
				 */
				static reverseRotation(rotation) {
					rotation.angle *= -1;
					return rotation;
				}

				/**
				 * @param {array} [vector] - Contains x, y, and z values.
				 */
				constructor(vector) {
					this.set(vector);
				}

				/**
				 * @return {array}
				 */
				toArray() {
					return this.vector;
				}

				/**
				 * @param {array} vector - The new vector to store.
				 */
				set(vector) {
					if (typeof vector === 'undefined') {
						return;
					}

					this.vector = vector.map(value => Math.round(value));
				}

				/**
				 * @param {number} value - The value to store.
				 */
				setX(value) {
					this.vector[0] = value;
				}

				/**
				 * @param {number} value - The value to store.
				 */
				setY(value) {
					this.vector[1] = value;
				}

				/**
				 * @param {number} value - The value to store.
				 */
				setZ(value) {
					this.vector[2] = value;
				}

				/**
				 * @return {number}
				 */
				getX() {
					return this.toArray()[0];
				}

				/**
				 * @return {number}
				 */
				getY() {
					return this.toArray()[1];
				}

				/**
				 * @return {number}
				 */
				getZ() {
					return this.toArray()[2];
				}

				/**
				 * Kind of a flimsy method. If this vector points parallel to an axis, this
				 * returns true. A hacky way to find this is to count the number of 0's and
				 * return true if and only if the count is 2.
				 * @return {boolean}
				 */
				isAxis() {
					let count = 0;
					for (let value of this.vector) {
						if (value === 0) {
							count += 1;
						}
					}

					return count === 2;
				}

				/**
				 * Kind of a flimsy method. If this vector points parallel to an axis, return
				 * that axis.
				 * @return {string}
				 */
				getAxis() {
					if (!this.isAxis()) {
						return;
					}

					if (this.vector[0] !== 0) return 'x';
					if (this.vector[1] !== 0) return 'y';
					if (this.vector[2] !== 0) return 'z';
				}

				/**
				 * Kind of a flimsy method. If this vector points parallel to an axis, return
				 * the magnitude of the value along that axis. (Basically, return whether it
				 * is positive or negative.)
				 * @return {number}
				 */
				getMagnitude() {
					if (!this.isAxis()) {
						return;
					}

					return this[`get${this.getAxis().toUpperCase()}`]();
				}

				/**
				 * @param {string} axis - The axis to rotate around.
				 * @param {number} angle - The angle of rotation.
				 * @return {Vector}
				 */
				rotate(axis, angle) {
					axis = axis.toLowerCase();

					this.set(rotate[axis]([], this.vector, [0, 0, 0], angle));
					return this;
				}
			}




			/***/ }),
			/* 5 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return F2LCaseBaseSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__F2LBaseSolver__ = __webpack_require__(15);


			class F2LCaseBaseSolver extends __WEBPACK_IMPORTED_MODULE_0__F2LBaseSolver__["a" /* F2LBaseSolver */] {
				solve({ corner, edge }) {
					return this._solve({ corner, edge });
				}
			}




			/***/ }),
			/* 6 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Cubie; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Vector__ = __webpack_require__(4);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Face__ = __webpack_require__(14);



			class Cubie {
				/**
				 * Factory method. Returns an instance of a cubie identified by the faces it
				 * sits on.
				 * @param {array} faces - A list of all the faces this cubie sits on.
				 */
				static FromFaces(faces) {
					let position = new __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */]([0, 0, 0]);
					let colorMap = {};

					for (let face of faces) {
						if (!face) {
							continue;
						}

						let temp = new __WEBPACK_IMPORTED_MODULE_1__Face__["a" /* Face */](face);
						let axis = temp.vector.getAxis().toUpperCase();
						position[`set${axis}`](temp.vector.getMagnitude());

						colorMap[face.toLowerCase()] = temp.toString()[0].toLowerCase();
					}

					return new Cubie({ position: position.toArray(), colorMap });
				}

				/**
				 * @param {object} [options]
				 * @param {object} options.position - The cubie's position.
				 * @param {object} options.colorMap - A map with faces as keys and colors
				 * as values. For example: { 'front' : 'f' }.
				 */
				constructor({ position, colorMap = {} }) {
					this.position(position);
					this.colorMap = {};

					Object.keys(colorMap).forEach(face => {
						let color = colorMap[face];
						this.colorFace(face, color);
					});
				}

				/**
				 * @return {Cubie}
				 */
				clone() {
					return new Cubie({
						position: this.position(),
						colorMap: this.colorMap
					});
				}

				/**
				 * Getter/setter for the vector position.
				 * @param {array} [position] - The new position to store.
				 * @return {array}
				 */
				position(position) {
					if (typeof position === 'undefined') {
						return this.vector ? this.vector.toArray() : this.vector;
					}

					this.vector = new __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */](position);
				}

				/**
				 * @return {number}
				 */
				getX() {
					return this.vector.getX();
				}

				/**
				 * @return {number}
				 */
				getY() {
					return this.vector.getY();
				}

				/**
				 * @return {number}
				 */
				getZ() {
					return this.vector.getZ();
				}

				/**
				 * @return {boolean}
				 */
				isCorner() {
					return Object.keys(this.colorMap).length === 3;
				}

				/**
				 * @return {boolean}
				 */
				isEdge() {
					return Object.keys(this.colorMap).length === 2;
				}

				/**
				 * @return {boolean}
				 */
				isMiddle() {
					return Object.keys(this.colorMap).length === 1;
				}

				/**
				 * @return {array}
				 */
				colors() {
					return Object.keys(this.colorMap).map(face => this.colorMap[face]);
				}

				/**
				 * @param {string} color - Check if the cubie has this color.
				 * @return {boolean}
				 */
				hasColor(color) {
					color = color.toLowerCase();

					for (let face of Object.keys(this.colorMap)) {
						if (this.colorMap[face] === color) {
							return true;
						}
					}

					return false;
				}

				/**
				 * @param {string} face - Check if the cubie has this face.
				 * @return {boolean}
				 */
				hasFace(face) {
					face = face.toLowerCase();
					return Object.keys(this.colorMap).includes(face);
				}

				/**
				 * Sets a color on a given face or normal of a cubie.
				 * @param {string} face - The face of the cubie we want to set the color on.
				 * @param {string} color - The color we want to set.
				 * @return {Cubie}
				 */
				colorFace(face, color) {
					face = face.toLowerCase();
					color = color.toLowerCase();

					this.colorMap[face] = color;
					return this;
				}

				/**
				 * @param {string} face - The color on the face this cubie sits on.
				 * @return {string}
				 */
				getColorOfFace(face) {
					face = face.toLowerCase();

					return this.colorMap[face];
				}

				/**
				 * @param {string} color - Find the face that this color sits on.
				 * @return {string}
				 */
				getFaceOfColor(color) {
					color = color.toLowerCase();

					return Object.keys(this.colorMap).find(cubieColor => {
						return this.colorMap[cubieColor] === color;
					});
				}

				/**
				 * Return all the faces this cubie sits on.
				 * @return {array}
				 */
				faces() {
					return Object.keys(this.colorMap);
				}

				/**
				 * Rotates the position vector around `axis` by `angle`. Updates the internal
				 * position vector and the normal-color map.
				 * @param {string} axis - The axis of rotation.
				 * @param {number} angle - The magnitude of rotation.
				 * @return {null}
				 */
				rotate(axis, angle) {
					// update position vector after rotation
					this.vector.rotate(axis, angle);

					// update normal-color map
					let newMap = {}; // need to completely overwrite the old one

					// go through each normal, rotate it, and assign the new normal the old color
					for (let face of Object.keys(this.colorMap)) {
						let color = this.colorMap[face];
						let faceModel = new __WEBPACK_IMPORTED_MODULE_1__Face__["a" /* Face */](face);

						let newNormal = faceModel.rotate(axis, angle).normal().join(' ');
						let newFace = __WEBPACK_IMPORTED_MODULE_1__Face__["a" /* Face */].FromNormal(newNormal).toString().toLowerCase();

						newMap[newFace] = color;
					}

					this.colorMap = {};
					Object.keys(newMap).forEach(face => this.colorFace(face, newMap[face]));
				}
			}




			/***/ }),
			/* 7 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CrossSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseSolver__ = __webpack_require__(3);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const CROSS_COLOR = 'u';
			const R = (moves) => __WEBPACK_IMPORTED_MODULE_1__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			class CrossSolver extends __WEBPACK_IMPORTED_MODULE_0__BaseSolver__["a" /* BaseSolver */] {
				constructor(...args) {
					super(...args);

					this.phase = 'cross';
				}

				solve() {
					let crossEdges = this._getCrossEdges();
					for (let edge of crossEdges) {
						let partition = this._solve({ edge });
						this.partitions.push(partition);
					}

					return this.partitions;
				}

				isSolved() {
					let edges = this._getCrossEdges();
					for (let edge of edges) {
						if (!this.isEdgeSolved(edge)) {
							return false;
						}
					}

					return true;
				}

				isEdgeSolved(edge) {
					let otherColor = edge.colors().find(color => color !== 'u');
					let otherFace = edge.faces().find(face => face !== 'up');
					const matchesMiddle = otherFace[0] === otherColor;
					const isOnCrossFace = edge.getColorOfFace('up') === 'u';

					return isOnCrossFace && matchesMiddle;
				}

				/**
				 * Finds all edges that have 'F' as a color.
				 * @return {array}
				 */
				_getCrossEdges() {
					return this.cube.edges().filter(edge => edge.hasColor(CROSS_COLOR));
				}

				/**
				 * 6 Cases!
				 * 1) The edge's UP color is on the UP face.
				 * 2) the edge's UP color is on the DOWN face.
				 * 3) The edge's UP color is not on the UP or DOWN face and the other color is on the UP face.
				 * 4) The edge's UP color is not on the UP or DOWN face and the other color is on the DOWN face.
				 * 5) The edge's UP color is not on the UP or DOWN face and the other color is on the RELATIVE RIGHT face.
				 * 6) The edge's UP color is not on the UP or DOWN face and the other color is on the RELATIVE LEFT face.
				 *
				 * @param {cubie} edge
				 */
				_getCaseNumber({ edge }) {
					if (edge.getColorOfFace('up') === CROSS_COLOR) {
						return 1;
					} else if (edge.getColorOfFace('down') === CROSS_COLOR) {
						return 2;
					}

					if (edge.faces().includes('up')) {
						return 3;
					} else if (edge.faces().includes('down')) {
						return 4;
					}

					let crossFace = edge.getFaceOfColor(CROSS_COLOR);
					let otherFace = edge.getFaceOfColor(edge.colors().find(color => color !== CROSS_COLOR));
					let direction = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(crossFace, otherFace, { up: 'up' });

					if (direction === 'right') {
						return 5;
					} else if (direction === 'left') {
						return 6;
					}
				}

				_solveCase1({ edge }) {
					if (this.isEdgeSolved(edge)) {
						return;
					}

					let face = edge.faces().find(face => face !== 'up');
					this.move(`${face} ${face}`, { upperCase: true });
					this._solveCase2({ edge });
				}

				_solveCase2({ edge }) {
					let solveMoves = this._case1And2Helper({ edge }, 2);
					this.move(solveMoves, { upperCase: true });
				}

				_solveCase3({ edge }) {
					let prepMove = this._case3And4Helper({ edge }, 3);
					this.move(prepMove, { upperCase: true });
					this._solveCase5({ edge });
				}

				_solveCase4({ edge }) {
					let prepMove = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])(
						'down',
						edge.getFaceOfColor('u'),
						__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace('down'))
					);
					this.move(prepMove, { upperCase: true });

					let edgeToMiddle = R(edge.getFaceOfColor('u'));

					this.move(edgeToMiddle, { upperCase: true });
					this._solveCase5({ edge });
				}

				_solveCase5({ edge }) {
					let solveMoves = this._case5And6Helper({ edge }, 5);
					this.move(solveMoves, { upperCase: true });
				}

				_solveCase6({ edge }) {
					let solveMoves = this._case5And6Helper({ edge }, 6);
					this.move(solveMoves, { upperCase: true });
				}

				_case1And2Helper({ edge }, caseNum) {
					let crossColorFace = caseNum === 1 ? 'up' : 'down';
					let currentFace = edge.faces().find(face => face !== crossColorFace);
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace(currentFace));

					let solveMoves = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])(crossColorFace, currentFace, targetFace);

					if (caseNum === 2) {
						let edgeToCrossFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["f" /* getMoveOfFace */])(targetFace);
						solveMoves += ` ${edgeToCrossFace} ${edgeToCrossFace}`;
					}

					return solveMoves;
				}

				_case3And4Helper({ edge }, caseNum) {
					let prepMove = edge.faces().find(face => !['up', 'down'].includes(face));

					if (caseNum === 4) {
						prepMove = R(prepMove);
					}

					return prepMove;
				}

				_case5And6Helper({ edge }, caseNum) {
					let otherColor = edge.colors().find(color => color !== 'u');
					let currentFace = edge.getFaceOfColor(otherColor);
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(otherColor);

					let prepMove = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('up', currentFace, targetFace);
					let edgeToCrossFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["f" /* getMoveOfFace */])(currentFace);

					if (caseNum === 6) {
						edgeToCrossFace = R(edgeToCrossFace);
					}

					return `${R(prepMove)} ${edgeToCrossFace} ${prepMove}`;
				}

				_getPartitionBefore({ edge }) {
					return { edge: edge.clone() };
				}

				_getPartitionAfter({ edge }) {
					return { edge };
				}
			}




			/***/ }),
			/* 8 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return F2LSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__F2LBaseSolver__ = __webpack_require__(15);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cases_case_1__ = __webpack_require__(34);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cases_case_2__ = __webpack_require__(35);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__cases_case_3__ = __webpack_require__(36);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__utils__ = __webpack_require__(0);







			const R = (moves) => __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			class F2LSolver extends __WEBPACK_IMPORTED_MODULE_1__F2LBaseSolver__["a" /* F2LBaseSolver */] {
				constructor(...args) {
					super(...args);

					this.subCaseOptions = Object.assign(this.options, {
						_overrideAfterEach: true
					});
				}

				solve() {
					this.partitions = [];

					let pairs = this.getAllPairs();
					pairs.forEach(({ corner, edge }) => {
						let partition = this._solve({ corner, edge });
						this.partitions.push(partition);
					});

					return this.partitions;
				}

				isSolved() {
					let pairs = this.getAllPairs();
					for (let pair of pairs) {
						if (!this.isPairSolved(pair)) {
							return false;
						}
					}

					return true;
				}

				getAllPairs() {
					let corners = this.cube.corners().filter(corner => {
						return corner.hasColor('u');
					});
					let edges = this.cube.edges().filter(edge => {
						return !edge.hasColor('u') && !edge.hasColor('d');
					});

					let pairs = [];

					for (let edge of edges) {
						let corner = corners.find(corner => {
							let colors = edge.colors();
							return corner.hasColor(colors[0]) && corner.hasColor(colors[1]);
						});

						pairs.push({ edge, corner });
					}

					return pairs;
				}

				/**
				 * 4 top level cases: (cross face is UP)
				 *
				 * 1) Corner and edge are both on the DOWN face.
				 * 2) Corner is on the DOWN face and edge is not on DOWN face.
				 * 3) Corner is on UP face and edge is on DOWN face.
				 * 4) Corner is on UP face and edge is not on DOWN face.
				 */
				_getCaseNumber({ corner, edge }) {
					if (corner.faces().includes('down')) {
						if (edge.faces().includes('down')) {
							return 1;
						}
						if (!edge.faces().includes('down') && !edge.faces().includes('up')) {
							return 2;
						}
					}

					if (corner.faces().includes('up')) {
						if (edge.faces().includes('down')) {
							return 3;
						}
						if (!edge.faces().includes('down') && !edge.faces().includes('up')) {
							return 4;
						}
					}

					throw new Error('Could not find a top level F2L case');
				}

				_solveCase1({ corner, edge }) {
					let solver = new __WEBPACK_IMPORTED_MODULE_2__cases_case_1__["a" /* Case1Solver */](this.cube, this.subCaseOptions);
					let partition = solver.solve({ corner, edge });

					this.totalMoves = partition.moves;
					this.partition.caseNumber = [this.partition.caseNumber, partition.caseNumber];
				}

				_solveCase2({ corner, edge }) {
					let solver = new __WEBPACK_IMPORTED_MODULE_3__cases_case_2__["a" /* Case2Solver */](this.cube, this.subCaseOptions);
					let partition = solver.solve({ corner, edge });

					this.totalMoves = partition.moves;
					this.partition.caseNumber = [this.partition.caseNumber, partition.caseNumber];
				}

				_solveCase3({ corner, edge }) {
					let solver = new __WEBPACK_IMPORTED_MODULE_4__cases_case_3__["a" /* Case3Solver */](this.cube, this.subCaseOptions);
					let partition = solver.solve({ corner, edge });

					this.totalMoves = partition.moves;
					this.partition.caseNumber = [this.partition.caseNumber, partition.caseNumber];
				}

				_solveCase4({ corner, edge }) {
					if (this.isPairSolved({ corner, edge })) {
						return;
					}

					let solver;
					if (corner.faces().includes(edge.faces()[0]) &&
							corner.faces().includes(edge.faces()[1])) {
						solver = new __WEBPACK_IMPORTED_MODULE_2__cases_case_1__["a" /* Case1Solver */](this.cube, this.subCaseOptions);
					} else {
						solver = new __WEBPACK_IMPORTED_MODULE_3__cases_case_2__["a" /* Case2Solver */](this.cube, this.subCaseOptions);
					}

					let faces = corner.faces().filter(face => face !== 'up');
					let dir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__utils__["c" /* getDirectionFromFaces */])(faces[0], faces[1], { up: 'down' });
					let cornerRightFace = dir === 'right' ? faces[1] : faces[0];

					this.move(`${cornerRightFace} D ${R(cornerRightFace)}`, { upperCase: true });

					let partition = solver.solve({ corner, edge });

					this.partition.caseNumber = [this.partition.caseNumber, partition.caseNumber];
					this.totalMoves = [...this.totalMoves, ...partition.moves];
				}
			}




			/***/ }),
			/* 9 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return OLLSolver; });
			/* harmony import */ __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__BaseSolver__ = __webpack_require__(3);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const SOLVED_STATE = '00000000';

			class OLLSolver extends __WEBPACK_IMPORTED_MODULE_1__BaseSolver__["a" /* BaseSolver */] {
				constructor(...args) {
					super(...args);
					this.phase = 'oll';

					// orientations in order based on http://badmephisto.com/oll.php, however the
					// actual algorithms may be different.
					this.algorithms = {
						[SOLVED_STATE]: '', // solved state
						'21000110': 'F R U RPrime UPrime FPrime', // 1
						'21211010': 'F R U RPrime UPrime FPrime F R U RPrime UPrime FPrime', // 2
						'10201020': 'R U2 RPrime UPrime R U RPrime UPrime R UPrime RPrime', // 3
						'01112000': 'F U R UPrime RPrime FPrime', // 4
						'11102120': 'F U R UPrime RPrime U R UPrime RPrime FPrime', // 5
						'11210000': 'RPrime UPrime FPrime U F R', // 6
						'11102021': 'FPrime LPrime UPrime L U LPrime UPrime L U F', // 7
						'10011110': 'R L2 BPrime L BPrime LPrime B2 L BPrime L RPrime', // 8
						'00202121': 'LPrime R2 B RPrime B R B2 RPrime B RPrime L', // 9
						'01111111': 'F U R UPrime RPrime FPrime L F U FPrime UPrime LPrime', // 10
						'21212101': 'F U R UPrime RPrime FPrime R B U BPrime UPrime RPrime', // 11
						'21211111': 'F R U RPrime UPrime FPrime B U L UPrime LPrime BPrime', // 12
						'20201010': 'R U2 R2 UPrime R2 UPrime R2 U2 R', // 13
						'01101110': 'R B RPrime L U LPrime UPrime R BPrime RPrime', // 14
						'21002120': 'LPrime BPrime L RPrime UPrime R U LPrime B L', // 15
						'21001100': 'RPrime F R U RPrime UPrime FPrime U R', // 16
						'01000100': 'R U RPrime UPrime MPrime U R UPrime rPrime', // 17
						'01010101': 'M U R U RPrime UPrime M2 U R UPrime rPrime', // 18
						'10211021': 'F R U RPrime UPrime R U RPrime UPrime FPrime B U L UPrime LPrime BPrime', // 19
						'11000120': 'R U RPrime UPrime RPrime F R FPrime', // 20
						'10000020': 'LPrime BPrime R B L BPrime RPrime B', // 21
						'20001000': 'B LPrime BPrime R B L BPrime RPrime', // 22
						'00112001': 'RPrime UPrime RPrime F R FPrime U R', // 23
						'21112111': 'R U2 RPrime RPrime F R FPrime U2 RPrime F R FPrime', // 24
						'10002101': 'R U2 RPrime RPrime F R FPrime R U2 RPrime', // 25
						'21110101': 'M U R U RPrime UPrime MPrime RPrime F R FPrime', // 26
						'11212010': 'F LPrime U2 L U2 L F2 LPrime F', // 27
						'01110020': 'R U RPrime U R UPrime RPrime UPrime RPrime F R FPrime', // 28
						'10012100': 'RPrime UPrime R UPrime RPrime U R U R BPrime RPrime B', // 29
						'10112021': 'RPrime UPrime R UPrime RPrime U FPrime U F R', // 30
						'01110121': 'F U R UPrime RPrime FPrime F U FPrime UPrime FPrime L F LPrime', // 31
						'01112101': 'F U R UPrime RPrime FPrime B U BPrime UPrime SPrime U B UPrime bPrime', // 32
						'21212000': 'lPrime U2 L U LPrime U l', // 33
						'01212020': 'r U RPrime U R U2 rPrime', // 34
						'00202020': 'R U RPrime U R U2 RPrime', // 35
						'10101000': 'RPrime UPrime R URprime RPrime U2 R', // 36
						'01001021': 'RPrime U R U2 RPrime UPrime FPrime U F U R', // 37
						'10200101': 'R UPrime RPrime U2 R U B UPrime BPrime UPrime RPrime', // 38
						'21102011': 'r U RPrime U R UPrime RPrime U R U2 rPrime', // 39
						'21112010': 'lPrime UPrime L UPrime LPrime U L UPrime LPrime U2 l', // 40
						'11100011': 'r U2 RPrime UPrime R UPrime rPrime', // 41
						'11012000': 'F R UPrime RPrime UPrime R U RPrime FPrime', // 42
						'11001011': 'lPrime UPrime L UPrime LPrime U2 l', // 43
						'01010000': 'r U RPrime UPrime M U R UPrime RPrime', // 44
						'01002110': 'R U RPrime UPrime BPrime RPrime F R FPrime B', // 45
						'01202120': 'L FPrime LPrime UPrime L F LPrime FPrime U F', // 46
						'11001110': 'RPrime F R U RPrime FPrime R F UPrime FPrime', // 47
						'10200000': 'R2 D RPrime U2 R DPrime RPrime U2 RPrime', // 48
						'20112011': 'RPrime U2 R2 U RPrime U R U2 BPrime RPrime B', // 49
						'10000121': 'R U BPrime UPrime RPrime U R B RPrime', // 50
						'11000021': 'RPrime UPrime F U R UPrime RPrime FPrime R', // 51
						'01100120': 'L FPrime LPrime UPrime L U F UPrime LPrime', // 52
						'11112020': 'RPrime F R2 FPrime U2 FPrime U2 F RPrime', // 53
						'20110100': 'BPrime RPrime B LPrime BPrime R R BPrime RPrime B2 L', // 54
						'20100101': 'B L BPrime R B L2 B L B2 RPrime', // 55
						'01101011': 'FPrime UPrime F L FPrime LPrime U L F LPrime', // 56
						'21012020': 'F U FPrime RPrime F R UPrime RPrime FPrime R', // 57
					};
				}

				isSolved() {
					return this.getOllString() === SOLVED_STATE;
				}

				solve() {
					return this._solve();
				}

				_getCaseNumber() {
					return this.getOllString();
				}

				_solveCase(ollString) {
					let pattern = this.findPattern(ollString);
					let algorithm = this.getAlgorithm(pattern);
					let frontFace = this._getFrontFace(ollString, pattern);

					this.move(algorithm, {
						orientation: { up: 'down', front: frontFace }
					});
				}

				getOllString() {
					let orientations = [];

					let cubies = this._getOllCubies();
					cubies.forEach(cubie => {
						let orientation = this._getCubieOrientation(cubie);
						orientations.push(orientation);
					});

					return orientations.join('');
				}

				/**
				 * @param {string} [ollString] - Probably unnecessary. If passed in, it saves
				 * a step computing the ollString.
				 */
				findPattern(ollString) {
					if (typeof ollString === 'undefined') {
						ollString = this.getOllString();
					}

					for (let i = 0; i < 4; i++) {
						let algorithm = this.algorithms[ollString];

						if (typeof algorithm === 'string') {
							return ollString;
						} else {
							ollString = this._rotateOllStringLeft(ollString);
						}
					}

					throw new Error(`No pattern found for oll string "${ollString}"`);
				}

				/**
				 * @param {string} [pattern] - The pattern on this OLL or the ollString.
				 */
				getAlgorithm(pattern) {
					if (typeof pattern === 'undefined') {
						pattern = this.getPattern(pattern); // pattern can be an ollString
					}

					if (typeof this.algorithms[pattern] === 'undefined') {
						throw new Error(`No algorithm found for pattern "${pattern}"`);
					}

					return this.algorithms[pattern];
				}

				_getOllCubies() {
					let positions = [
						['front', 'down', 'right'],
						['front', 'down'],
						['front', 'down', 'left'],
						['left', 'down'],
						['left', 'down', 'back'],
						['back', 'down'],
						['back', 'down', 'right'],
						['right', 'down']
					];

					return positions.map(pos => this.cube.getCubie(pos));
				}

				/**
				 * Returns a number indicating the orientation of the cubie.
				 * 0 --> The DOWN color is on the DOWN face.
				 * 1 --> The DOWN color is a clockwise rotation from "solved".
				 * 2 --> The DOWN color is a counter-clockwise rotation from "solved".
				 */
				_getCubieOrientation(cubie) {
					if (cubie.getColorOfFace('down') === 'd') {
						return 0;
					}

					// if cubie is an edge piece, return 1
					if (cubie.isEdge()) {
						return 1;
					}

					let [face1, face2] = cubie.faces().filter(face => face !== 'down');
					let dir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(face1, face2, { up: 'down' });
					let rightFace = dir === 'right' ? face2 : face1;

					return cubie.getColorOfFace(rightFace) === 'd' ? 1 : 2;
				}

				_getFrontFace(ollString, pattern) {
					let rotationOrder = ['front', 'left', 'back', 'right'];

					for (let i = 0; i < 4; i++) {
						if (ollString === pattern) {
							return rotationOrder[i];
						} else {
							ollString = this._rotateOllStringLeft(ollString);
						}
					}

					throw new Error(`OLL string "${ollString}" does not resolve to the pattern "${pattern}"`);
				}

				_rotateOllStringLeft(ollString) {
					return ollString.slice(2) + ollString.slice(0, 2);
				}

				_getPartitionBefore() {
					return this.getOllString();
				}

				_getPartitionAfter() {
					return null;
				}
			}




			/***/ }),
			/* 10 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PLLSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseSolver__ = __webpack_require__(3);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);



			const SOLVED_STATE = '0 0 0 0 0 0 0 0';

			class PLLSolver extends __WEBPACK_IMPORTED_MODULE_0__BaseSolver__["a" /* BaseSolver */] {
				constructor(...args) {
					super(...args);
					this.phase = 'pll';

					// permutations in order based on http://badmephisto.com/pll.php, however
					// the actual algorithms may be different.
					this.algorithms = {
						[SOLVED_STATE]: '', // already solved
						'2 -1 1 -1 1 0 0 2': 'R2 F2 RPrime BPrime R F2 RPrime B RPrime', // #1
						'-1 1 -1 2 2 0 0 1': 'R BPrime R F2 RPrime B R F2 R2', // #2
						'1 -1 2 2 0 0 1 -1': 'R UPrime R U R U R UPrime RPrime UPrime R2', // #3
						'-1 1 -1 1 0 0 2 2': 'R2 U R U RPrime UPrime RPrime UPrime RPrime U RPrime', // #4
						'2 2 2 2 2 2 2 2': 'M M U M M U2 M M U M M', // #5
						'0 1 1 1 1 0 2 2': 'R U RPrime UPrime RPrime F R2 UPrime RPrime UPrime R U RPrime FPrime', // #6
						'1 0 2 0 1 0 0 0': 'R U2 RPrime UPrime R U2 LPrime U RPrime UPrime L', // #7
						'0 2 2 0 1 1 1 1': 'F R UPrime RPrime UPrime R U RPrime FPrime R U RPrime UPrime RPrime F R FPrime', // #8
						'1 -1 -1 2 -1 -1 1 0': 'RPrime U2 R U2 RPrime F R U RPrime UPrime RPrime FPrime R2', // #9
						'0 1 -1 -1 2 -1 -1 1': 'R UPrime RPrime UPrime R U R D RPrime UPrime R DPrime RPrime U2 RPrime', // #10
						'0 2 -1 -1 -1 -1 2 0': 'RPrime U RPrime UPrime BPrime D BPrime DPrime B2 RPrime BPrime R B R', // #11
						'2 -1 -1 -1 -1 2 0 0': 'RPrime UPrime FPrime R U RPrime UPrime RPrime F R2 UPrime RPrime UPrime R U RPrime U R', // #12
						'-1 2 2 2 -1 2 0 2': 'L U LPrime B2 uPrime B UPrime BPrime U BPrime u B2', // #13
						'2 -1 2 0 2 -1 2 2': 'RPrime UPrime R B2 u BPrime U B UPrime B uPrime B2', // #14
						'2 -1 1 1 0 1 1 -1': 'R2 uPrime R UPrime R U RPrime u R2 B UPrime BPrime', // #15
						'1 0 1 1 -1 2 -1 1': 'R2 u RPrime U RPrime UPrime R uPrime R2 FPrime U F', // #16
						'1 -1 -1 1 1 -1 -1 1': 'U RPrime UPrime R UPrime R U R UPrime RPrime U R U R2 UPrime RPrime', // #17
						'0 1 0 0 0 1 0 2': 'LPrime U2 L U LPrime U2 R UPrime L U RPrime', // #18
						'1 1 -1 -1 1 1 -1 -1': 'R BPrime RPrime F R B RPrime FPrime R B RPrime F R BPrime RPrime FPrime', // #19
						'2 0 2 0 2 0 2 0': 'R U RPrime U R U RPrime FPrime R U RPrime UPrime RPrime F R2 UPrime RPrime U2 R UPrime RPrime', // #20
						'0 2 0 2 0 2 0 2': 'RPrime U R UPrime RPrime FPrime UPrime F R U RPrime F RPrime FPrime R UPrime R', // #21
					};
				}

				solve() {
					return this._solve();
				}

				_getCaseNumber() {
					return this.getPllString();
				}

				_solveCase(pllString) {
					let pattern = this.findPattern(pllString);
					let algorithm = this.getAlgorithm(pattern);
					let frontFace = this._getFrontFace(pllString, pattern);

					this.move(algorithm, {
						orientation: { up: 'down', front: frontFace }
					});

					// may need an extra rotation of DOWN for a complete solve
					let cubie = this.cube.getCubie(['down', 'front']); // any cubie on DOWN
					let origin = 'front';
					let target = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["a" /* getFaceOfMove */])(cubie.getColorOfFace(origin));
					let lastLayerMove = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["b" /* getRotationFromTo */])('down', origin, target);

					this.move(lastLayerMove);
				}

				isSolved() {
					return this.cube.isSolved();
				}

				/**
				 * Permutations are unique in the way that each cubie is permutated relative
				 * to the one adjacent to it. For each cubie (in order), find the relative
				 * direction from its color to the next cubie's color, and turn it into a
				 * number. This will allow each permutation to be held in a unique string.
				 */
				getPllString() {
					let pllString = [];
					let pllCubies = this._getPllCubies();

					let faces = ['front', 'left', 'back', 'right']; // we're upside down

					for (let i = 0; i < pllCubies.length; i++) {
						let cubie1 = pllCubies[i];
						let cubie2 = pllCubies[i + 1];
						let faceToCheck = faces[~~(i / 2)];

						// get the colors of the two cubies
						let color1 = cubie1.getColorOfFace(faceToCheck);

						// wrap around to the first cubie
						if (!cubie2) {
							cubie2 = pllCubies[0];
						}
						let color2 = cubie2.getColorOfFace(faceToCheck);

						// find the direction between the two
						let face1 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["a" /* getFaceOfMove */])(color1);
						let face2 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["a" /* getFaceOfMove */])(color2);

						// turn it into a number
						let direction = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["c" /* getDirectionFromFaces */])(face1, face2, { up: 'down' });
						if (direction === 'front') direction = 0;
						if (direction === 'right') direction = 1;
						if (direction === 'left') direction = -1;
						if (direction === 'back') direction = 2;

						pllString.push(direction);
					}

					return pllString.join(' ');
				}

				findPattern(pllString) {
					let initialString = pllString;

					if (typeof pllString === 'undefined') {
						pllString = this.getPllString();
					}

					for (let i = 0; i < 4; i++) {
						let algorithm = this.algorithms[pllString];

						if (typeof algorithm === 'string') {
							return pllString;
						} else {
							pllString = this._rotatePllStringLeft(pllString);
						}
					}

					throw new Error(`No pattern found for pll string "${initialString}"`);
				}

				getAlgorithm(pattern) {
					if (typeof pattern === 'undefined') {
						pattern = this.findPattern(pattern); // pattern can be a pllString
					}

					if (typeof this.algorithms[pattern] === 'undefined') {
						throw new Error(`No algorithm found for pattern "${pattern}"`);
					}

					return this.algorithms[pattern];
				}

				_getPllCubies() {
					let positions = [
						['front', 'down', 'right'],
						['front', 'down'],
						['front', 'down', 'left'],
						['left', 'down'],
						['left', 'down', 'back'],
						['back', 'down'],
						['back', 'down', 'right'],
						['right', 'down']
					];

					return positions.map(pos => this.cube.getCubie(pos));
				}

				_getCubiePermutation(cubie) {
					// pick a face, any face (expect for the down face)
					let face = cubie.faces().find(face => face !== 'down');

					// get the cube face this face lies on
					let cubeFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["a" /* getFaceOfMove */])(cubie.getColorOfFace(face));

					// find the move that will permute the cubie correctly
					let moveToSolveCubie = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__utils__["b" /* getRotationFromTo */])('down', face, cubeFace);
					moveToSolveCubie = moveToSolveCubie.toLowerCase();

					// translate the move to a number
					let dir;
					if (moveToSolveCubie === '') dir = 0;
					else if (moveToSolveCubie.includes('prime')) dir = 1;
					else if (moveToSolveCubie.split(' ').length > 1) dir = 2;
					else dir = -1;

					return dir;
				}

				_rotatePllStringLeft(pllString) {
					let arr = pllString.split(' ').map(num => parseInt(num));
					return [...arr.slice(2), ...arr.slice(0, 2)].join(' ');
				}

				_getFrontFace(pllString, pattern) {
					let rotationOrder = ['front', 'left', 'back', 'right'];

					for (let i = 0; i < 4; i++) {
						if (pllString === pattern) {
							return rotationOrder[i];
						} else {
							pllString = this._rotatePllStringLeft(pllString);
						}
					}

					throw new Error(`OLL string "${pllString}" does not resolve to the pattern "${pattern}"`);
				}
			}




			/***/ }),
			/* 11 */
			/***/ (function(module, exports, __webpack_require__) {

			module.exports = function () {
				return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
			};


			/***/ }),
			/* 12 */
			/***/ (function(module, exports) {

			module.exports = cross;

			/**
			 * Computes the cross product of two vec3's
			 *
			 * @param {vec3} out the receiving vector
			 * @param {vec3} a the first operand
			 * @param {vec3} b the second operand
			 * @returns {vec3} out
			 */
			function cross(out, a, b) {
			    var ax = a[0], ay = a[1], az = a[2],
			        bx = b[0], by = b[1], bz = b[2];

			    out[0] = ay * bz - az * by;
			    out[1] = az * bx - ax * bz;
			    out[2] = ax * by - ay * bx;
			    return out
			}

			/***/ }),
			/* 13 */
			/***/ (function(module, exports) {

			// shim for using process in browser
			var process = module.exports = {};

			// cached from whatever global is present so that test runners that stub it
			// don't break things.  But we need to wrap it in a try catch in case it is
			// wrapped in strict mode code which doesn't define any globals.  It's inside a
			// function because try/catches deoptimize in certain engines.

			var cachedSetTimeout;
			var cachedClearTimeout;

			function defaultSetTimout() {
			    throw new Error('setTimeout has not been defined');
			}
			function defaultClearTimeout () {
			    throw new Error('clearTimeout has not been defined');
			}
			(function () {
			    try {
			        if (typeof setTimeout === 'function') {
			            cachedSetTimeout = setTimeout;
			        } else {
			            cachedSetTimeout = defaultSetTimout;
			        }
			    } catch (e) {
			        cachedSetTimeout = defaultSetTimout;
			    }
			    try {
			        if (typeof clearTimeout === 'function') {
			            cachedClearTimeout = clearTimeout;
			        } else {
			            cachedClearTimeout = defaultClearTimeout;
			        }
			    } catch (e) {
			        cachedClearTimeout = defaultClearTimeout;
			    }
			} ());
			function runTimeout(fun) {
			    if (cachedSetTimeout === setTimeout) {
			        //normal enviroments in sane situations
			        return setTimeout(fun, 0);
			    }
			    // if setTimeout wasn't available but was latter defined
			    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
			        cachedSetTimeout = setTimeout;
			        return setTimeout(fun, 0);
			    }
			    try {
			        // when when somebody has screwed with setTimeout but no I.E. maddness
			        return cachedSetTimeout(fun, 0);
			    } catch(e){
			        try {
			            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
			            return cachedSetTimeout.call(null, fun, 0);
			        } catch(e){
			            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
			            return cachedSetTimeout.call(this, fun, 0);
			        }
			    }


			}
			function runClearTimeout(marker) {
			    if (cachedClearTimeout === clearTimeout) {
			        //normal enviroments in sane situations
			        return clearTimeout(marker);
			    }
			    // if clearTimeout wasn't available but was latter defined
			    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
			        cachedClearTimeout = clearTimeout;
			        return clearTimeout(marker);
			    }
			    try {
			        // when when somebody has screwed with setTimeout but no I.E. maddness
			        return cachedClearTimeout(marker);
			    } catch (e){
			        try {
			            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
			            return cachedClearTimeout.call(null, marker);
			        } catch (e){
			            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
			            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
			            return cachedClearTimeout.call(this, marker);
			        }
			    }



			}
			var queue = [];
			var draining = false;
			var currentQueue;
			var queueIndex = -1;

			function cleanUpNextTick() {
			    if (!draining || !currentQueue) {
			        return;
			    }
			    draining = false;
			    if (currentQueue.length) {
			        queue = currentQueue.concat(queue);
			    } else {
			        queueIndex = -1;
			    }
			    if (queue.length) {
			        drainQueue();
			    }
			}

			function drainQueue() {
			    if (draining) {
			        return;
			    }
			    var timeout = runTimeout(cleanUpNextTick);
			    draining = true;

			    var len = queue.length;
			    while(len) {
			        currentQueue = queue;
			        queue = [];
			        while (++queueIndex < len) {
			            if (currentQueue) {
			                currentQueue[queueIndex].run();
			            }
			        }
			        queueIndex = -1;
			        len = queue.length;
			    }
			    currentQueue = null;
			    draining = false;
			    runClearTimeout(timeout);
			}

			process.nextTick = function (fun) {
			    var args = new Array(arguments.length - 1);
			    if (arguments.length > 1) {
			        for (var i = 1; i < arguments.length; i++) {
			            args[i - 1] = arguments[i];
			        }
			    }
			    queue.push(new Item(fun, args));
			    if (queue.length === 1 && !draining) {
			        runTimeout(drainQueue);
			    }
			};

			// v8 likes predictible objects
			function Item(fun, array) {
			    this.fun = fun;
			    this.array = array;
			}
			Item.prototype.run = function () {
			    this.fun.apply(null, this.array);
			};
			process.title = 'browser';
			process.browser = true;
			process.env = {};
			process.argv = [];
			process.version = ''; // empty string to avoid regexp issues
			process.versions = {};

			function noop() {}

			process.on = noop;
			process.addListener = noop;
			process.once = noop;
			process.off = noop;
			process.removeListener = noop;
			process.removeAllListeners = noop;
			process.emit = noop;
			process.prependListener = noop;
			process.prependOnceListener = noop;

			process.listeners = function (name) { return [] };

			process.binding = function (name) {
			    throw new Error('process.binding is not supported');
			};

			process.cwd = function () { return '/' };
			process.chdir = function (dir) {
			    throw new Error('process.chdir is not supported');
			};
			process.umask = function() { return 0; };


			/***/ }),
			/* 14 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Face; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Vector__ = __webpack_require__(4);


			const faceToNormal = {
				front: '0 0 1',
				right: '1 0 0',
				up: '0 1 0',
				down: '0 -1 0',
				left: '-1 0 0',
				back: '0 0 -1'
			};

			class Face {
				/**
				 * Factory method.
				 * @param {string|array} normal - The normal that identifies this face.
				 * @return {Face}
				 */
				static FromNormal(normal) {
					if (typeof normal === 'string') {
						normal = __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */].FromString(normal).toArray();
					}

					return new Face(Face.getFace(normal));
				}

				/**
				 * @param {string} face - A string that identifies a face.
				 * @return {array}
				 */
				static getNormal(face) {
					return __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */].FromString(faceToNormal[face]).toArray();
				}

				/**
				 * @param {string|array} normal - The normal that identifies a face.
				 * @return {string}
				 */
				static getFace(normal) {
					if (typeof normal === 'string') {
						normal = __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */].FromString(normal).toArray();
					}

					for (let face of Object.keys(faceToNormal)) {
						if (normal.join(' ') === faceToNormal[face]) {
							return face;
						}
					}
				}

				/**
				 * @param {string} face - The string of a face, e.g. 'RIGHT'.
				 */
				constructor(face) {
					if (typeof face !== 'string') {
						throw new Error(`"face" must be a string (received: ${face})`);
					}

					face = face.toLowerCase();

					this.vector = __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */].FromString(faceToNormal[face]);
				}

				/**
				 * Method to return the normal as an array.
				 * @return {array}
				 */
				normal() {
					return this.vector.toArray();
				}

				/**
				 * @return {string}
				 */
				toString() {
					return Face.getFace(this.normal());
				}

				/**
				 * Simulates an orientation change where this face becomes the new given face.
				 * NOTE: this only changes this face's normals, not any cubies' positions.
				 * @param {string|Face} face - The new face, e.g. 'FRONT'
				 */
				orientTo(newFace) {
					if (typeof newFace === 'string') {
						newFace = new Face(newFace);
					}

					let { axis, angle } = __WEBPACK_IMPORTED_MODULE_0__Vector__["a" /* Vector */].getRotationFromNormals(this.normal(), newFace.normal());
					this.vector.rotate(axis, angle);
					return this;
				}

				/**
				 * Convenience method for rotating this face. NOTE: this only changes this
				 * face's normals, not any cubies' positions.
				 * @param {string} axis - Axis of rotation.
				 * @param {number} angle - Angle of rotation.
				 * @return {Face}
				 */
				rotate(axis, angle) {
					this.vector.rotate(axis, angle);
					return this;
				}
			}

			Face.FRONT = new Face('FRONT');
			Face.RIGHT = new Face('RIGHT');
			Face.UP = new Face('UP');
			Face.DOWN = new Face('DOWN');
			Face.LEFT = new Face('LEFT');
			Face.BACK = new Face('BACK');




			/***/ }),
			/* 15 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return F2LBaseSolver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__BaseSolver__ = __webpack_require__(3);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const R = (moves) => __WEBPACK_IMPORTED_MODULE_1__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			class F2LBaseSolver extends __WEBPACK_IMPORTED_MODULE_0__BaseSolver__["a" /* BaseSolver */] {
				constructor(...args) {
					super(...args);

					this.phase = 'f2l';
				}

				colorsMatch({ corner, edge }) {
					let colors = edge.colors();

					if (corner.colors().includes(colors[0]) && corner.colors().includes(colors[1])) {
						return true;
					}

					return false;
				}

				/**
				 * Returns true only if the pair is matched and in the correct slot.
				 */
				isPairSolved({ corner, edge }) {
					if (!this.isPairMatched({ corner, edge })) {
						return false;
					}

					// is the corner on the cross face?
					if (corner.getFaceOfColor('u') !== 'up') {
						return false;
					}

					// are the edge's colors on the correct face? (e.g. is the edge's 'F' color
					// on the 'FRONT' face)?
					for (let color of edge.colors()) {
						if (edge.getFaceOfColor(color) !== __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(color)) {
							return false;
						}
					}

					return true;
				}

				isPairMatched({ corner, edge }) {
					// are the two non-cross colors the same?
					if (!this.colorsMatch({ corner, edge })) {
						return false;
					}

					// for each color, do the corner and edge share the same face?
					for (let color of edge.colors()) {
						if (corner.getFaceOfColor(color) !== edge.getFaceOfColor(color)) {
							return false;
						}
					}

					return true;
				}

				isPairSeparated({ corner, edge }) {
					// colors must match
					if (!this.colorsMatch({ corner, edge })) {
						return false;
					}

					// corner's white face cannot be UP or DOWN
					if (['up', 'down'].includes(corner.getFaceOfColor('u'))) {
						return false;
					}

					// edge must be on the DOWN face
					if (!edge.faces().includes('down')) {
						return false;
					}


					let otherColor = corner.colors().find(color => {
						return color !== 'u' && corner.getFaceOfColor(color) !== 'down';
					});

					// edge must be oriented properly
					if (edge.getFaceOfColor(otherColor) !== 'down') {
						return false;
					}

					// corner and edge must be one move away from matching
					let isOneMoveFromMatched = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(otherColor),
						edge.getFaceOfColor(corner.getColorOfFace('down')),
						{ up: 'up' }
					) === 'back';

					return isOneMoveFromMatched;
				}

				solveMatchedPair({ corner, edge }) {
					if (!this.isPairMatched({ corner, edge })) {
						throw new Error('Pair is not matched');
					}

					// get the color that is not on the down face and is not the crossColor
					let matchedColor = edge.colors().find(color => {
						return edge.getFaceOfColor(color) !== 'down';
					});

					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						edge.getFaceOfColor(matchedColor),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';

					let matchingFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(matchedColor);
					let currentFace = corner.getFaceOfColor(matchedColor);
					let prepFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(matchingFace, isLeft ? 'left' : 'right', { up: 'down' });

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, prepFace);
					let open = isLeft ? matchingFace : R(matchingFace);
					let insert = isLeft ? 'DPrime' : 'D';

					let solveMoves = [prep, open, insert, R(open)].join(' ');
					this.move(solveMoves, { upperCase: true });
					return solveMoves;
				}

				solveSeparatedPair({ corner, edge }) {
					if (!this.isPairSeparated({ corner, edge })) {
						throw new Error('Pair is not separated');
					}

					// get the color that is not on the down face and is not the crossColor
					let matchedColor = edge.colors().find(color => {
						return edge.getFaceOfColor(color) !== 'down';
					});

					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor('u'),
						edge.getFaceOfColor(matchedColor),
						{ up: 'down' }
					).toUpperCase() === 'LEFT';

					let currentFace = corner.getFaceOfColor('u');
					let prepFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(matchedColor);

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, prepFace);
					let match = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["f" /* getMoveOfFace */])(prepFace);
					match = isLeft ? R(match) : match;
					let insert = isLeft ? 'DPrime' : 'D';

					let solveMoves = [prep, match, insert, R(match)].join(' ');
					this.move(solveMoves, { upperCase: true });
					return solveMoves;
				}

				_getPartitionBefore({ corner, edge }) {
					return {
						corner: corner.clone(),
						edge: edge.clone()
					};
				}

				_getPartitionAfter({ corner, edge }) {
					return { corner, edge };
				}
			}




			/***/ }),
			/* 16 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Solver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__solvers_cross__ = __webpack_require__(7);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__solvers_f2l__ = __webpack_require__(8);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__solvers_oll__ = __webpack_require__(9);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__solvers_pll__ = __webpack_require__(10);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__utils__ = __webpack_require__(0);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__algorithm_shortener__ = __webpack_require__(2);








			class Solver {
				/**
				 * @param {string|RubiksCube} cubeState - Can be one of 3 things:
				 * 1) A string representing a Rubik's Cube state.
				 * 2) A string containing a list of moves to make from a solved state to
				 *    identify a cube state.
				 * 3) An instance of a RubiksCube.
				 */
				constructor(cubeState, options) {
					if (cubeState instanceof __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */]) {
						this.cube = cubeState;
					} else if (typeof cubeState === 'string') {
						// if there are spaces present in cubeState, assume it's a set of
						// scramble moves.
						// it's possible that one or no scramble moves are present.
						let magicNum = 6; // longest possible move string -- e.g. Rprime
						if (cubeState.split(' ').length > 1 || cubeState.length <= magicNum) {
							this.cube = __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */].Solved();
							this.cube.move(cubeState);
						} else {
							this.cube = new __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */](cubeState);
						}
					} else {
						throw new Error('"cubeState" is not a valid cubeState. Please provide a list of scramble moves or a string representing a cube state');
					}

					this.options = options;
					this.phases = ['cross', 'f2l', 'oll', 'pll'];
					this.progress = {};

					this.phases.forEach(phase => this.progress[phase] = []);

					// save each partition to this.progress after each solve
					const afterEach = (partition, phase) => {
						this._updateProgress(partition, phase);
					};

					this.currentPhase = null; // good for debugging
					this.currentSolver = null; // good for debugging

					this.crossSolver = new __WEBPACK_IMPORTED_MODULE_1__solvers_cross__["a" /* CrossSolver */](this.cube, this.options);
					this.f2lSolver = new __WEBPACK_IMPORTED_MODULE_2__solvers_f2l__["a" /* F2LSolver */](this.cube, this.options);
					this.ollSolver = new __WEBPACK_IMPORTED_MODULE_3__solvers_oll__["a" /* OLLSolver */](this.cube, this.options);
					this.pllSolver = new __WEBPACK_IMPORTED_MODULE_4__solvers_pll__["a" /* PLLSolver */](this.cube, this.options);

					this.afterEach('all', afterEach);
				}

				afterEach(phases, callback) {
					// argument parsing
					if (typeof phases === 'function') {
						// if first argument is a function, default phases to 'all'
						callback = phases;
						phases = 'all';
					} else if (typeof phases === 'string') {
						if (phases === 'all') {
							// 'all': shortcut for array of all phases
							phases = this.phases.slice();
						} else {
							// lastly turn phases into an array
							phases = [phases];
						}
					}

					// error handling
					if (typeof callback !== 'function') {
						throw new Error('"afterEach" callback is not a function.');
					}

					// error handling
					for (let phase of phases) {
						if (!this.phases.includes(phase)) {
							throw new Error(`Phase "${phase}" isn't recognized. Please specify "cross", "f2l", "oll", "pll", or "all".`);
						}
					}

					// if everything has gone okay, add the callback
					for (let phase of phases) {
						let solver = this[`${phase}Solver`];
						solver.afterEach(callback);
					}
				}

				solve() {
					this.currentPhase = 'cross';
					this.currentSolver = this.crossSolver;
					this.crossSolver.solve();

					this.currentPhase = 'f2l';
					this.currentSolver = this.f2lSolver;
					this.f2lSolver.solve();

					this.currentPhase = 'oll';
					this.currentSolver = this.ollSolver;
					this.ollSolver.solve();

					this.currentPhase = 'pll';
					this.currentSolver = this.pllSolver;
					this.pllSolver.solve();
				}

				getMoves() {
					let moves = [];

					Object.keys(this.progress).forEach(phase => {
						let partitions = this.progress[phase];
						partitions.forEach(partition => moves.push(...partition.moves));
					});

					moves = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__utils__["h" /* normalizeNotations */])(moves);

					return moves.join(' ');
				}

				getPartitions() {
					let ret = {};
					let phases = Object.keys(this.progress);
					phases.forEach(phase => {
						let partitions = this.progress[phase];

						if (partitions.length === 1) {
							ret[phase] = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__algorithm_shortener__["a" /* algorithmShortener */])(partitions[0].moves);
						} else {
							let phaseMoves = [];
							this.progress[phase].forEach(partition => {
								phaseMoves.push(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6__algorithm_shortener__["a" /* algorithmShortener */])(partition.moves));
							});
							ret[phase] = phaseMoves;
						}
					});

					return ret;
				}

				isCrossEdgeSolved(edge) {
					return this.crossSolver.isEdgeSolved(edge);
				}

				isF2LPairSolved({ corner, edge }) {
					return this.f2lSolver.isPairSolved({ corner, edge });
				}

				isOLLSolved() {
					return this.ollSolver.isSolved();
				}

				isPLLSolved() {
					return this.pllSolver.isSolved();
				}

				_updateProgress(partition, phase) {
					this.progress[phase].push(partition);
				}
			}




			/***/ }),
			/* 17 */
			/***/ (function(module, exports, __webpack_require__) {
			/* WEBPACK VAR INJECTION */(function(module) {

			function assembleStyles () {
				var styles = {
					modifiers: {
						reset: [0, 0],
						bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
						dim: [2, 22],
						italic: [3, 23],
						underline: [4, 24],
						inverse: [7, 27],
						hidden: [8, 28],
						strikethrough: [9, 29]
					},
					colors: {
						black: [30, 39],
						red: [31, 39],
						green: [32, 39],
						yellow: [33, 39],
						blue: [34, 39],
						magenta: [35, 39],
						cyan: [36, 39],
						white: [37, 39],
						gray: [90, 39]
					},
					bgColors: {
						bgBlack: [40, 49],
						bgRed: [41, 49],
						bgGreen: [42, 49],
						bgYellow: [43, 49],
						bgBlue: [44, 49],
						bgMagenta: [45, 49],
						bgCyan: [46, 49],
						bgWhite: [47, 49]
					}
				};

				// fix humans
				styles.colors.grey = styles.colors.gray;

				Object.keys(styles).forEach(function (groupName) {
					var group = styles[groupName];

					Object.keys(group).forEach(function (styleName) {
						var style = group[styleName];

						styles[styleName] = group[styleName] = {
							open: '\u001b[' + style[0] + 'm',
							close: '\u001b[' + style[1] + 'm'
						};
					});

					Object.defineProperty(styles, groupName, {
						value: group,
						enumerable: false
					});
				});

				return styles;
			}

			Object.defineProperty(module, 'exports', {
				enumerable: true,
				get: assembleStyles
			});

			/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(32)(module)));

			/***/ }),
			/* 18 */
			/***/ (function(module, exports, __webpack_require__) {

			let chalk;
			let DEBUG;

			const DEFAULTS = {
				cancel() {
					return false;
				},
				ignore() {
					return false;
				}
			};

			class Combiner {
				constructor(input, options) {
					this.options = Object.assign({}, DEFAULTS, options);

					if (this.options.DEBUG) {
						chalk = __webpack_require__(20);
						DEBUG = options.DEBUG;
					}

					this.input = input.slice();
					this.output = [];
				}

				run() {
					if (this.input.length <= 1) {
						return this.input;
					}

					this.temp = [this.input.shift()];

					let action, actionValue, tempSnapshot; // for debugging

					while (this.temp.length > 0) {
						debug(() => {
							console.log(chalk.bold('========= START ========='));
							this._logInfo();
							console.log();
						});

						// find the first element that shouldn't be ignored
						let notIgnoredIdx, notIgnoredEl;

						if (this.temp.length === 1) {
							notIgnoredIdx = 0;
							notIgnoredEl = this.input[notIgnoredIdx];

							while (notIgnoredIdx < this.input.length && this.options.ignore(this.temp[0], notIgnoredEl)) {
								notIgnoredEl = this.input[++notIgnoredIdx];
							}

							if (notIgnoredIdx < this.input.length) {
								this.temp.push(notIgnoredEl);
							}
						}

						debug(() => tempSnapshot = this.temp.slice());

						if (this.temp.length === 0) {
							debug(() => {
								console.log(chalk.green('breaking'));
								console.log(chalk.bold('========= END ========='));
								console.log();
							});
							break;
						}

						if (this.temp.length === 1) {
							this.output.push(this.temp.pop());
							this.populateTempForward();

							debug(() => {
								console.log(chalk.green('continuing'));
								this._logInfo();
								console.log(chalk.bold('========= END ========='));
								console.log();
							});
							continue;
						}

						if (this.options.compare(this.temp[0], this.temp[1])) {
							// remove the combined element from the input array
							if (notIgnoredIdx !== undefined) {
								this.input.splice(notIgnoredIdx, 1);
							}
							const value = this.options.combine(this.temp[0], this.temp[1]);

							debug(() => {
								action = 'Combining:';
								actionValue = value;
							});

							this.temp = this.options.cancel(value) ? [] : [value];

							this.populateTempBackward();
							if (this.temp.length === 0) {
								this.populateTempForward();
							}
						} else {
							this.output.push(this.temp.shift());

							// This keeps elements in order.
							// if (notIgnoredIdx === 0) {
							// 	this.input.splice(notIgnoredIdx, 1);
							// } else {
							// 	this.temp = this.input.splice(0, 1);
							// }

							if (notIgnoredIdx !== undefined) {
								if (notIgnoredIdx > 0) {
									this.temp = this.input.splice(0, 1);
								} else {
									this.input.splice(notIgnoredIdx, 1);
								}
							}

							debug(() => action = 'Skipping:');
						}

						debug(() => {
							// log the action taken
							console.log(chalk.green(action), tempSnapshot);
							console.log(chalk.green('value:'), actionValue);
							console.log();

							// log the status
							this._logInfo();
							console.log(chalk.bold('========= END ========='));
							console.log();

							action = null;
							actionValue = null;
							tempSnapshot = null;
						});
					}

					debug(() => {
						console.log(chalk.bold.green('========= FINAL ========='));
						this._logInfo();
						console.log(chalk.bold.green('========= FINAL ========='));
						console.log();
					});

					return this.output;
				}

				populateTempBackward() {
					if (this.output.length > 0) {
						this.temp.unshift(this.output.pop());
					}
				}

				populateTempForward() {
					if (this.input.length > 0) {
						this.temp.push(this.input.shift());
					}
				}

				_logInfo() {
					console.log(chalk.bold('output'), this.output);
					console.log(chalk.bold('temp'), this.temp);
					console.log(chalk.bold('input'), this.input);
				}
			}

			module.exports = Combiner;


			//=======================================================
			// Debugging functions
			//=======================================================
			function debug(callback) {
				if (!DEBUG) {
					return;
				}

				callback && callback();
			}


			/***/ }),
			/* 19 */
			/***/ (function(module, exports, __webpack_require__) {

			const Combiner = __webpack_require__(18);

			/**
			 * Given an array, combines adjacent elements. Callbacks that indicate if two
			 * elements can be combined and what the combined value is must be given. When
			 * two elements are combined, both elements are removed from the output array
			 * and in their place is the combined value. If the combined value is undefined
			 * then both elements are removed and nothing is inserted in their place. When
			 * the combined value is inserted, the following elements will be compared with
			 * the combined value and not the original element.
			 *
			 * @param {array} array - The input array.
			 * @param {object} options - Options.
			 * @param {function} [options.cancel] - Returns a boolean indicating whether two elements should be cancelled (and no value is inserted).
			 * @param {function} options.combine - Returns the combined value of two elements.
			 * @param {function} options.compare - Returns a boolean indicating whether two elements can be combined.
			 * @param {function} [options.ignore] - Returns a boolean indicating whether to ignore an element and continue with the next.
			 */
			module.exports = (input, options = {}) => {
				validateInput(input, options);

				const combiner = new Combiner(input, options);
				return combiner.run();
			};


			//=======================================================
			// Helper functions
			//=======================================================
			function validateInput(input, options) {
				if (!input) {
					throw new Error(`Why are you even importing this.`);
				}

				if (!options.compare) {
					throw new Error(`options.compare callback must be present`);
				}

				if (!options.combine) {
					throw new Error(`options.combine callback must be present`);
				}
			}


			/***/ }),
			/* 20 */
			/***/ (function(module, exports, __webpack_require__) {
			/* WEBPACK VAR INJECTION */(function(process) {
			var escapeStringRegexp = __webpack_require__(21);
			var ansiStyles = __webpack_require__(17);
			var stripAnsi = __webpack_require__(30);
			var hasAnsi = __webpack_require__(29);
			var supportsColor = __webpack_require__(31);
			var defineProps = Object.defineProperties;
			var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

			function Chalk(options) {
				// detect mode if not set manually
				this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
			}

			// use bright blue on Windows as the normal blue color is illegible
			if (isSimpleWindowsTerm) {
				ansiStyles.blue.open = '\u001b[94m';
			}

			var styles = (function () {
				var ret = {};

				Object.keys(ansiStyles).forEach(function (key) {
					ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

					ret[key] = {
						get: function () {
							return build.call(this, this._styles.concat(key));
						}
					};
				});

				return ret;
			})();

			var proto = defineProps(function chalk() {}, styles);

			function build(_styles) {
				var builder = function () {
					return applyStyle.apply(builder, arguments);
				};

				builder._styles = _styles;
				builder.enabled = this.enabled;
				// __proto__ is used because we must return a function, but there is
				// no way to create a function with a different prototype.
				/* eslint-disable no-proto */
				builder.__proto__ = proto;

				return builder;
			}

			function applyStyle() {
				// support varags, but simply cast to string in case there's only one arg
				var args = arguments;
				var argsLen = args.length;
				var str = argsLen !== 0 && String(arguments[0]);

				if (argsLen > 1) {
					// don't slice `arguments`, it prevents v8 optimizations
					for (var a = 1; a < argsLen; a++) {
						str += ' ' + args[a];
					}
				}

				if (!this.enabled || !str) {
					return str;
				}

				var nestedStyles = this._styles;
				var i = nestedStyles.length;

				// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
				// see https://github.com/chalk/chalk/issues/58
				// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
				var originalDim = ansiStyles.dim.open;
				if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
					ansiStyles.dim.open = '';
				}

				while (i--) {
					var code = ansiStyles[nestedStyles[i]];

					// Replace any instances already present with a re-opening code
					// otherwise only the part of the string until said closing code
					// will be colored, and the rest will simply be 'plain'.
					str = code.open + str.replace(code.closeRe, code.open) + code.close;
				}

				// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
				ansiStyles.dim.open = originalDim;

				return str;
			}

			function init() {
				var ret = {};

				Object.keys(styles).forEach(function (name) {
					ret[name] = {
						get: function () {
							return build.call(this, [name]);
						}
					};
				});

				return ret;
			}

			defineProps(Chalk.prototype, init());

			module.exports = new Chalk();
			module.exports.styles = ansiStyles;
			module.exports.hasColor = hasAnsi;
			module.exports.stripColor = stripAnsi;
			module.exports.supportsColor = supportsColor;

			/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)));

			/***/ }),
			/* 21 */
			/***/ (function(module, exports, __webpack_require__) {


			var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

			module.exports = function (str) {
				if (typeof str !== 'string') {
					throw new TypeError('Expected a string');
				}

				return str.replace(matchOperatorsRe, '\\$&');
			};


			/***/ }),
			/* 22 */
			/***/ (function(module, exports, __webpack_require__) {

			module.exports = angle;

			var fromValues = __webpack_require__(24);
			var normalize = __webpack_require__(25);
			var dot = __webpack_require__(23);

			/**
			 * Get the angle between two 3D vectors
			 * @param {vec3} a The first operand
			 * @param {vec3} b The second operand
			 * @returns {Number} The angle in radians
			 */
			function angle(a, b) {
			    var tempA = fromValues(a[0], a[1], a[2]);
			    var tempB = fromValues(b[0], b[1], b[2]);
			 
			    normalize(tempA, tempA);
			    normalize(tempB, tempB);
			 
			    var cosine = dot(tempA, tempB);

			    if(cosine > 1.0){
			        return 0
			    } else {
			        return Math.acos(cosine)
			    }     
			}


			/***/ }),
			/* 23 */
			/***/ (function(module, exports) {

			module.exports = dot;

			/**
			 * Calculates the dot product of two vec3's
			 *
			 * @param {vec3} a the first operand
			 * @param {vec3} b the second operand
			 * @returns {Number} dot product of a and b
			 */
			function dot(a, b) {
			    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
			}

			/***/ }),
			/* 24 */
			/***/ (function(module, exports) {

			module.exports = fromValues;

			/**
			 * Creates a new vec3 initialized with the given values
			 *
			 * @param {Number} x X component
			 * @param {Number} y Y component
			 * @param {Number} z Z component
			 * @returns {vec3} a new 3D vector
			 */
			function fromValues(x, y, z) {
			    var out = new Float32Array(3);
			    out[0] = x;
			    out[1] = y;
			    out[2] = z;
			    return out
			}

			/***/ }),
			/* 25 */
			/***/ (function(module, exports) {

			module.exports = normalize;

			/**
			 * Normalize a vec3
			 *
			 * @param {vec3} out the receiving vector
			 * @param {vec3} a vector to normalize
			 * @returns {vec3} out
			 */
			function normalize(out, a) {
			    var x = a[0],
			        y = a[1],
			        z = a[2];
			    var len = x*x + y*y + z*z;
			    if (len > 0) {
			        //TODO: evaluate use of glm_invsqrt here?
			        len = 1 / Math.sqrt(len);
			        out[0] = a[0] * len;
			        out[1] = a[1] * len;
			        out[2] = a[2] * len;
			    }
			    return out
			}

			/***/ }),
			/* 26 */
			/***/ (function(module, exports) {

			module.exports = rotateX;

			/**
			 * Rotate a 3D vector around the x-axis
			 * @param {vec3} out The receiving vec3
			 * @param {vec3} a The vec3 point to rotate
			 * @param {vec3} b The origin of the rotation
			 * @param {Number} c The angle of rotation
			 * @returns {vec3} out
			 */
			function rotateX(out, a, b, c){
			    var by = b[1];
			    var bz = b[2];

			    // Translate point to the origin
			    var py = a[1] - by;
			    var pz = a[2] - bz;

			    var sc = Math.sin(c);
			    var cc = Math.cos(c);

			    // perform rotation and translate to correct position
			    out[0] = a[0];
			    out[1] = by + py * cc - pz * sc;
			    out[2] = bz + py * sc + pz * cc;

			    return out
			}


			/***/ }),
			/* 27 */
			/***/ (function(module, exports) {

			module.exports = rotateY;

			/**
			 * Rotate a 3D vector around the y-axis
			 * @param {vec3} out The receiving vec3
			 * @param {vec3} a The vec3 point to rotate
			 * @param {vec3} b The origin of the rotation
			 * @param {Number} c The angle of rotation
			 * @returns {vec3} out
			 */
			function rotateY(out, a, b, c){
			    var bx = b[0];
			    var bz = b[2];

			    // translate point to the origin
			    var px = a[0] - bx;
			    var pz = a[2] - bz;
			    
			    var sc = Math.sin(c);
			    var cc = Math.cos(c);
			  
			    // perform rotation and translate to correct position
			    out[0] = bx + pz * sc + px * cc;
			    out[1] = a[1];
			    out[2] = bz + pz * cc - px * sc;
			  
			    return out
			}


			/***/ }),
			/* 28 */
			/***/ (function(module, exports) {

			module.exports = rotateZ;

			/**
			 * Rotate a 3D vector around the z-axis
			 * @param {vec3} out The receiving vec3
			 * @param {vec3} a The vec3 point to rotate
			 * @param {vec3} b The origin of the rotation
			 * @param {Number} c The angle of rotation
			 * @returns {vec3} out
			 */
			function rotateZ(out, a, b, c){
			    var bx = b[0];
			    var by = b[1];

			    //Translate point to the origin
			    var px = a[0] - bx;
			    var py = a[1] - by;
			  
			    var sc = Math.sin(c);
			    var cc = Math.cos(c);

			    // perform rotation and translate to correct position
			    out[0] = bx + px * cc - py * sc;
			    out[1] = by + px * sc + py * cc;
			    out[2] = a[2];
			  
			    return out
			}


			/***/ }),
			/* 29 */
			/***/ (function(module, exports, __webpack_require__) {

			var ansiRegex = __webpack_require__(11);
			var re = new RegExp(ansiRegex().source); // remove the `g` flag
			module.exports = re.test.bind(re);


			/***/ }),
			/* 30 */
			/***/ (function(module, exports, __webpack_require__) {

			var ansiRegex = __webpack_require__(11)();

			module.exports = function (str) {
				return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
			};


			/***/ }),
			/* 31 */
			/***/ (function(module, exports, __webpack_require__) {
			/* WEBPACK VAR INJECTION */(function(process) {
			var argv = process.argv;

			var terminator = argv.indexOf('--');
			var hasFlag = function (flag) {
				flag = '--' + flag;
				var pos = argv.indexOf(flag);
				return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
			};

			module.exports = (function () {
				if ('FORCE_COLOR' in process.env) {
					return true;
				}

				if (hasFlag('no-color') ||
					hasFlag('no-colors') ||
					hasFlag('color=false')) {
					return false;
				}

				if (hasFlag('color') ||
					hasFlag('colors') ||
					hasFlag('color=true') ||
					hasFlag('color=always')) {
					return true;
				}

				if (process.stdout && !process.stdout.isTTY) {
					return false;
				}

				if (process.platform === 'win32') {
					return true;
				}

				if ('COLORTERM' in process.env) {
					return true;
				}

				if (process.env.TERM === 'dumb') {
					return false;
				}

				if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
					return true;
				}

				return false;
			})();

			/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)));

			/***/ }),
			/* 32 */
			/***/ (function(module, exports) {

			module.exports = function(module) {
				if(!module.webpackPolyfill) {
					module.deprecate = function() {};
					module.paths = [];
					// module.parent = undefined by default
					if(!module.children) module.children = [];
					Object.defineProperty(module, "loaded", {
						enumerable: true,
						get: function() {
							return module.l;
						}
					});
					Object.defineProperty(module, "id", {
						enumerable: true,
						get: function() {
							return module.i;
						}
					});
					module.webpackPolyfill = 1;
				}
				return module;
			};


			/***/ }),
			/* 33 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Solver__ = __webpack_require__(16);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__algorithm_shortener__ = __webpack_require__(2);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Solver", function() { return __WEBPACK_IMPORTED_MODULE_0__Solver__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__models_Cubie__ = __webpack_require__(6);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Cubie", function() { return __WEBPACK_IMPORTED_MODULE_2__models_Cubie__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__models_RubiksCube__ = __webpack_require__(1);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "RubiksCube", function() { return __WEBPACK_IMPORTED_MODULE_3__models_RubiksCube__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__solvers_cross__ = __webpack_require__(7);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CrossSolver", function() { return __WEBPACK_IMPORTED_MODULE_4__solvers_cross__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__solvers_f2l__ = __webpack_require__(8);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "F2LSolver", function() { return __WEBPACK_IMPORTED_MODULE_5__solvers_f2l__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__solvers_oll__ = __webpack_require__(9);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "OLLSolver", function() { return __WEBPACK_IMPORTED_MODULE_6__solvers_oll__["a"]; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__solvers_pll__ = __webpack_require__(10);
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "PLLSolver", function() { return __WEBPACK_IMPORTED_MODULE_7__solvers_pll__["a"]; });
			/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "algorithmShortener", function() { return __WEBPACK_IMPORTED_MODULE_1__algorithm_shortener__["a"]; });



			// solver constructor


			// models



			// solvers





			// algorithm shortener


			/**
			 * @param {string} cubeState - The string representing a cube state.
			 * @param {object} options
			 * @prop {boolean} options.partitioned - Whether to separate moves according to
			 * phase.
			 */
			/* harmony default export */ __webpack_exports__["default"] = ((cubeState, options = {}) => {
				let solver = new __WEBPACK_IMPORTED_MODULE_0__Solver__["a" /* Solver */](cubeState, options);
				solver.solve();

				if (options.partitioned) {
					return solver.getPartitions();
				} else {
					return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__algorithm_shortener__["a" /* algorithmShortener */])(solver.getMoves());
				}
			});


			/***/ }),
			/* 34 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Case1Solver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__ = __webpack_require__(5);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const R = (moves) => __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			/**
			 * Top level case 1:
			 * Both corner and edge are on the DOWN face.
			 */
			class Case1Solver extends __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__["a" /* F2LCaseBaseSolver */] {
				/**
				 * 10 Cases:
				 * 1) Pair is matched.
				 * 2) Pair is separated.
				 *
				 * ---- Group 1: Corner's white color is on DOWN face ----
				 * 3) Corner and edge share a face and colors on that face are equal.
				 * 4) Corner and edge share a face and colors on that face are not equal.
				 * 5) Corner and edge do not share a face.
				 *
				 * ---- Group 2: Corner's "other" color matches edge's "primary" color ----
				 * 6) Corner shares a face with edge.
				 * 7) Corner does not share a face with edge.
				 *
				 * ---- Group 3: Corner's "other" color doesn't match edge's "primary" color ----
				 * 8) Edge shares a face with corner's cross color's face.
				 * 9) Edge shares a face with corner's other color's face.
				 * 10) Corner does not share a face with edge.
				 *
				 * TODO: refactor
				 */
				_getCaseNumber({ corner, edge }) {
					if (this.isPairMatched({ corner, edge })) {
						return 1;
					}
					if (this.isPairSeparated({ corner, edge })) {
						return 2;
					}

					let sharedFace;
					edge.faces().forEach(face => {
						if (corner.faces().includes(face) && face !== 'down') {
							sharedFace = face;
						}
					});
					let otherColor = corner.colors().find(color => {
						return color !== 'u' && color !== corner.getColorOfFace('down');
					});
					let primaryColor = edge.colors().find(c => edge.getFaceOfColor(c) !== 'down');

					// Group 1
					if (corner.getFaceOfColor('u') === 'down') {
						if (sharedFace) {
							if (corner.getColorOfFace(sharedFace) === edge.getColorOfFace(sharedFace)) {
								return 3;
							} else {
								return 4;
							}
						} else {
							return 5;
						}
					}

					// Group 2
					if (otherColor === primaryColor) {
						if (sharedFace) {
							return 6;
						} else {
							return 7;
						}
					}

					// Group 3
					if (sharedFace) {
						if (sharedFace === corner.getFaceOfColor('u')) {
							return 8;
						} else {
							return 9;
						}
					} else {
						return 10;
					}
				}

				_solveCase1({ corner, edge }) {
					return this.solveMatchedPair({ corner, edge });
				}

				_solveCase2({ corner, edge }) {
					return this.solveSeparatedPair({ corner, edge });
				}

				_solveCase3({ corner, edge }) {
					// calculate which side the corner is on, the position, etc.
					let currentFace = edge.faces().find(face => face !== 'down');
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace('down'));
					let prepFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(targetFace, 'back', { up: 'down' });
					let otherFace = corner.getFaceOfColor(edge.getColorOfFace('down'));
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(currentFace, otherFace, { up: 'down' }) === 'left';

					// the moves
					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, prepFace);
					let moveFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace(currentFace));
					let dir = isLeft ? 'D' : 'DPrime';

					moveFace = isLeft ? moveFace : R(moveFace);

					let solveMoves = `${prep} ${moveFace} ${moveFace} D D `;
					solveMoves += `${moveFace} ${dir} ${R(moveFace)} ${dir} ${moveFace} ${moveFace}`;
					this.move(solveMoves, { upperCase: true });
				}

				_solveCase4({ corner, edge }) {
					// calculate which side the corner is on, the position, etc.
					let currentFace = edge.faces().find(face => face !== 'down');
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace(currentFace));
					let otherFace = corner.faces().find(face => !edge.faces().includes(face));
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(otherFace, currentFace, { up: 'down' }) === 'left';

					// the moves
					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let moveFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["f" /* getMoveOfFace */])(targetFace);
					moveFace = isLeft ? R(moveFace) : moveFace;

					this.move(`${prep} ${moveFace} D D ${R(moveFace)}`, { upperCase: true });
					this.solveSeparatedPair({ corner, edge });
				}

				_solveCase5({ corner, edge }) {
					let primary = edge.colors().find(color => edge.getFaceOfColor(color) !== 'down');
					let secondary = edge.colors().find(color => edge.getFaceOfColor(color) === 'down');

					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(
						__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(primary),
						__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(secondary),
						{ up: 'down' }
					) === 'right';

					let edgeCurrent = edge.getFaceOfColor(primary);
					let edgeTarget = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(primary);

					// do the prep move now. need to calculate things after this move is done
					let edgePrep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', edgeCurrent, edgeTarget);
					this.move(edgePrep, { upperCase: true });

					// calculate corner stuff
					let cornerCurrent = corner.getFaceOfColor(primary);
					let cornerTarget = edgeTarget;

					// the moves
					let cornerPrep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', cornerCurrent, cornerTarget);
					let open = isLeft ? R(edgeTarget) : edgeTarget;

					this.move(`${open} ${cornerPrep} ${R(open)}`, { upperCase: true });
					this.solveMatchedPair({ corner, edge });
				}

				_solveCase6({ corner, edge }) {
					let primary = edge.colors().find(color => edge.getFaceOfColor(color) !== 'down');

					let currentFace = edge.getFaceOfColor(primary);
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(edge.getColorOfFace('down'));
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						currentFace,
						corner.getFaceOfColor(primary),
						{ up: 'down' }
					) === 'left';

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let moveFace = isLeft ? targetFace : R(targetFace);
					let dir = isLeft ? 'DPrime' : 'D';

					this.move(`${prep} ${moveFace} ${dir} ${R(moveFace)}`, { upperCase: true });
					this.solveSeparatedPair({ corner, edge});
				}

				_solveCase7({ corner, edge }) {
					let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'down');
					let cornerCurrent = corner.getFaceOfColor('u');
					let cornerTarget = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(primary);
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(primary),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';

					let cornerPrep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', cornerCurrent, cornerTarget);
					this.move(cornerPrep, { upperCase: true });

					let edgeCurrent = edge.getFaceOfColor(primary);
					let edgeTarget = corner.getFaceOfColor(primary);

					let open = isLeft ? corner.getFaceOfColor('u') : R(corner.getFaceOfColor('u'));
					let edgeMatch = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', edgeCurrent, edgeTarget);
					this.move(`${open} ${edgeMatch} ${R(open)}`, { upperCase: true });

					this.solveMatchedPair({ corner, edge });
				}

				_solveCase8({ corner, edge }) {
					let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'down');
					let secondary = edge.colors().find(c => edge.getFaceOfColor(c) === 'down');

					let currentFace = corner.getFaceOfColor(secondary);
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(primary);

					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						currentFace,
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let open = isLeft ? R(targetFace) : targetFace;
					let dir = isLeft ? 'D' : 'DPrime';

					this.move(`${prep} ${open} ${dir} ${R(open)}`, { upperCase: true });
					this.solveSeparatedPair({ corner, edge });
				}

				_solveCase9({ corner, edge }) {
					let otherColor = edge.colors().find(c => edge.getFaceOfColor(c) === 'down');
					let currentFace = corner.getFaceOfColor('u');
					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(otherColor);

					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(otherColor),
						currentFace,
						{ up: 'down' }
					) === 'left';

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let moveFace = isLeft ? targetFace : R(targetFace);

					this.move(`${prep} ${moveFace} D D ${R(moveFace)}`, { upperCase: true });
					this.solveSeparatedPair({ corner, edge });
				}

				_solveCase10({ corner, edge }) {
					let primary = edge.colors().find(c => edge.getFaceOfColor(c) !== 'down');
					let secondary = edge.colors().find(c => edge.getFaceOfColor(c) === 'down');
					let cornerCurrent = corner.getFaceOfColor('u');
					let cornerTarget = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(secondary);
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(secondary),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';

					let cornerPrep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', cornerCurrent, cornerTarget);
					this.move(cornerPrep, { upperCase: true });

					let edgeCurrent = edge.getFaceOfColor(primary);
					let edgeTarget = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["a" /* getFaceOfMove */])(primary);

					let open = isLeft ? cornerTarget : R(cornerTarget);
					let edgePrep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', edgeCurrent, edgeTarget);

					this.move(`${open} ${edgePrep} ${R(open)}`, { upperCase: true });
					this.solveSeparatedPair({ corner, edge });
				}
			}




			/***/ }),
			/* 35 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Case2Solver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__ = __webpack_require__(5);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const R = (moves) => __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			/**
			 * Top level case 2:
			 * Corner is on the DOWN face and edge is not on DOWN or UP face.
			 */
			class Case2Solver extends __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__["a" /* F2LCaseBaseSolver */] {
				/**
				 * 4 cases:
				 *
				 * ---- Group 1: Corner's white color is on DOWN face ----
				 * 1) Pair can be matched up.
				 * 2) Pair cannot be matched up.
				 *
				 * ---- Group 2: Corner's white color is not on DOWN face ----
				 * 3) Corner's other color can match up with the edge color on that face.
				 * 4) Corner's other color cannot match up with the edge color on that face.
				 */
				_getCaseNumber({ corner, edge }) {
					// get relative right faces of corner and edge
					let cFaces = corner.faces().filter(face => face !== 'down');
					let eFaces = edge.faces();
					let cornerDir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(cFaces[0], cFaces[1], { up: 'down' });
					let edgeDir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(eFaces[0], eFaces[1], { up: 'down' });
					let cornerRight = cornerDir === 'right' ? cFaces[1] : cFaces[0];
					let edgeRight = edgeDir === 'right' ? eFaces[1] : eFaces[0];

					if (corner.getFaceOfColor('u') === 'down') {
						if (corner.getColorOfFace(cornerRight) === edge.getColorOfFace(edgeRight)) {
							return 1;
						} else {
							return 2;
						}
					}

					let otherColor = corner.colors().find(color => {
						return color !== 'u' && color !== corner.getColorOfFace('down');
					});
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(otherColor),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';
					let matchingEdgeColor = isLeft ?
						edge.getColorOfFace(edgeRight) :
						edge.colors().find(c => edge.getFaceOfColor(c) !== edgeRight);

					if (otherColor === matchingEdgeColor) {
						return 3;
					} else {
						return 4;
					}
				}

				_solveCase1({ corner, edge }) {
					let color = edge.colors()[0];
					let currentFace = corner.getFaceOfColor(color);
					let targetFace = edge.getFaceOfColor(color);

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					this.move(prep, { upperCase: true });

					let [face1, face2] = edge.faces();
					let dir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(face1 , face2, { up: 'down' });
					let rightFace = dir === 'right' ? face2 : face1;

					this.move(`${rightFace} DPrime ${R(rightFace)}`, { upperCase: true });
					this.solveMatchedPair({ corner, edge });
				}

				_solveCase2({ corner, edge }) {
					let currentFace = corner.getFaceOfColor(edge.colors()[0]);
					let targetFace = edge.getFaceOfColor(edge.colors()[1]);

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					this.move(prep, { upperCase: true });

					let dir = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(edge.faces()[0], edge.faces()[1], { up: 'down' });
					let rightFace = edge.faces()[dir === 'right' ? 1 : 0];

					this.move(`${rightFace} D ${R(rightFace)} DPrime`, { upperCase: true });
					this.move(`${rightFace} D ${R(rightFace)}`, { upperCase: true });

					this.solveSeparatedPair({ corner, edge });
				}

				_solveCase3({ corner, edge }) {
					this._case3And4Helper({ corner, edge }, 3);
				}

				_solveCase4({ corner, edge }) {
					this._case3And4Helper({ corner, edge }, 4);
				}

				_case3And4Helper({ corner, edge }, caseNum) {
					let downColor = corner.getColorOfFace('down');
					let otherColor = corner.colors().find(c => ![downColor, 'u'].includes(c));
					let matchingColor = caseNum === 3 ? otherColor : downColor;
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(otherColor),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';

					let currentFace = corner.getFaceOfColor('u');
					// let targetFace = getFaceOfMove(otherColor)
					let targetFace = edge.getFaceOfColor(matchingColor);

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let moveFace = isLeft ? targetFace : R(targetFace);
					let dir = isLeft ? 'DPrime' : 'D';
					dir = caseNum === 4 ? R(dir) : dir;

					this.move(`${prep} ${moveFace} ${dir} ${R(moveFace)}`, { upperCase: true });

					let method = `solve${caseNum === 3 ? 'Matched' : 'Separated'}Pair`;
					this[method]({ corner, edge });
				}
			}




			/***/ }),
			/* 36 */
			/***/ (function(module, __webpack_exports__, __webpack_require__) {
			/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Case3Solver; });
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__ = __webpack_require__(1);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__ = __webpack_require__(5);
			/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils__ = __webpack_require__(0);




			const R = (moves) => __WEBPACK_IMPORTED_MODULE_0__models_RubiksCube__["a" /* RubiksCube */].reverseMoves(moves);

			/**
			 * Top level case 3:
			 * Corner is on UP face and edge is on DOWN face.
			 */
			class Case3Solver extends __WEBPACK_IMPORTED_MODULE_1__F2LCaseBaseSolver__["a" /* F2LCaseBaseSolver */] {
				/**
			   * 2 cases:
			   *
			   * 1) Corner's cross color is on the cross face.
			   * 2) Corner's cross color is not on the cross face.
			   */
				_getCaseNumber({ corner, edge }) {
					if (corner.getColorOfFace('up') === 'u') {
						return 1;
					} else {
						return 2;
					}
				}

				_solveCase1({ corner, edge }) {
					let faces = corner.faces().filter(face => face !== 'up');
					let direction = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(faces[0], faces[1], { up: 'down' });
					let [leftFace, rightFace] = direction === 'right' ? faces : faces.reverse();

					let currentFace = edge.faces().find(face => face !== 'down');
					let primaryColor = edge.getColorOfFace(currentFace);

					let targetFace = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["e" /* getFaceFromDirection */])(
						corner.getFaceOfColor(primaryColor),
						primaryColor === corner.getColorOfFace(rightFace) ? 'right' : 'left',
						{ up: 'down' }
					);
					let isLeft = primaryColor === corner.getColorOfFace(leftFace);

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let moveFace = isLeft ? rightFace : R(leftFace);
					let dir = isLeft ? 'DPrime' : 'D';

					this.move(`${prep} ${moveFace} ${dir} ${R(moveFace)}`, { upperCase: true });
					this.solveMatchedPair({ corner, edge });
				}

				_solveCase2({ corner, edge }) {
					let otherColor = corner.colors().find(color => {
						return color !== 'u' && corner.getFaceOfColor(color) !== 'up';
					});
					let currentFace = edge.faces().find(face => face !== 'down');
					let primaryColor = edge.getColorOfFace(currentFace);

					let willBeMatched = otherColor !== primaryColor;
					let targetFace = corner.getFaceOfColor(willBeMatched ? otherColor : 'u');

					let prep = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["b" /* getRotationFromTo */])('down', currentFace, targetFace);
					let isLeft = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils__["c" /* getDirectionFromFaces */])(
						corner.getFaceOfColor(otherColor),
						corner.getFaceOfColor('u'),
						{ up: 'down' }
					) === 'left';
					let dir = isLeft ? 'DPrime' : 'D';
					let moveFace = corner.getFaceOfColor('u');
					moveFace = isLeft ? R(moveFace) : moveFace;

					this.move(`${prep} ${moveFace} ${dir} ${R(moveFace)}`, { upperCase: true });
					let solveFn = `solve${willBeMatched ? 'Matched' : 'Separated'}Pair`;
					this[solveFn]({ corner, edge });
				}
			}




			/***/ })
			/******/ ]);
			}); 
		} (index_es6$1));
		return index_es6$1.exports;
	}

	var index_es6Exports = requireIndex_es6();
	var solver = /*@__PURE__*/getDefaultExportFromCjs(index_es6Exports);

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
	let solutionSteps = '';
	let scramble = [];
	let presentIndex = 0;

	class Game {

	  constructor() {
	    this.setup2DCube();
	    // this.setup3DCube();
	  }

	  setup2DCube(){
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
	    // const cubeState = {
	    //   U: Array(9).fill("#555"),
	    //   D: Array(9).fill("#555"),
	    //   F: Array(9).fill("#555"),
	    //   B: Array(9).fill("#555"),
	    //   L: Array(9).fill("#555"),
	    //   R: Array(9).fill("#555"),
	    // };
	    const cubeState = {
	    U: [
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#fff7ff",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8",
	        "#41aac8"
	    ],
	    D: [
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#ffef48",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38",
	        "#82ca38"
	    ],
	    F: [
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#ef3923",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff",
	        "#fff7ff"
	    ],
	    B: [
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ff8c0a",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48",
	        "#ffef48"
	    ],
	    L: [
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#82ca38",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a",
	        "#ff8c0a"
	    ],
	    R: [
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#41aac8",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923",
	        "#ef3923"
	    ]
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

	    const convertStateForSolver = (state) => {
	      const colorToFaceLetter = {};
	      Object.entries(FACE_COLORS).forEach(([face, color]) => {
	        // The solver expects single-letter face names (U, D, L, R, F, B)
	        colorToFaceLetter[color] = face.charAt(0);
	      });

	      // The solver expects the faces in FRUDLB order.
	      const faceOrder = ['F', 'R', 'U', 'D', 'L', 'B'];

	      const data = faceOrder.map(faceLetter =>
	        state[faceLetter].map(hexColor => colorToFaceLetter[hexColor] || 'X') // 'X' for gray/unassigned
	          .join('')
	      ).join('');

	      return data;
	    };

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
	      console.log("cubeState", cubeState);

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

	      const solverString = convertStateForSolver(cubeState);
	      console.log("solverString", solverString);

	      const solution = solver(solverString.toLowerCase());
	      console.log("solution", solution);

	      if (solution && typeof solution === 'string') {
	        // The solver returns moves with 'prime' (e.g., "Rprime"),
	        // but the scrambler expects an apostrophe (e.g., "R'").
	        const scramblerFriendlySolution = solution.replace(/prime/g, "'");

	        console.log('Solution:', scramblerFriendlySolution);
	        solutionSteps = scramblerFriendlySolution;
	        output.textContent += `\nSolution: ${scramblerFriendlySolution}`;
	        
	        // Use the game's scrambler and controls to animate the solution.
	        // this.scrambler.scramble(scramblerFriendlySolution);
	        // this.controls.scrambleCube();
	        // const customCube = document.querySelector('#custom-cube');
	        // customCube.style.display = 'none'; 
	        // const mainUi = document.querySelector('#main-ui');
	        // mainUi.style.display = 'block';  
	        this.setup3DCube();
	      } else {
	        output.textContent += '\n❌ No solution found.';
	      }

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
	  }

	  setup3DCube(){
	    const customCube = document.querySelector('#custom-cube');
	    customCube.style.display = 'none'; 
	    const mainUi = document.querySelector('#main-ui');
	    mainUi.style.display = 'block';  
	    this.dom = {
	      ui: document.querySelector( '.ui' ),
	      game: document.querySelector( '.ui__game' ),
	      back: document.querySelector( '.ui__background' ),
	      prefs: document.querySelector( '.ui__prefs' ),
	      theme: document.querySelector( '.ui__theme' ),
	      stats: document.querySelector( '.ui__stats' ),
	      texts: {
	        title: document.querySelector( '.text--title' ),
	        note: document.querySelector( '.text--note' ),
	        button: document.querySelector( '.text--timer' ),
	        complete: document.querySelector( '.text--complete' ),
	        best: document.querySelector( '.text--best-time' ),
	        theme: document.querySelector( '.text--theme' ),
	      },
	      buttons: {
	        prefs: document.querySelector( '.btn--prefs' ),
	        back: document.querySelector( '.btn--back' ),
	        stats: document.querySelector( '.btn--stats' ),
	        reset: document.querySelector( '.btn--reset' ),
	        theme: document.querySelector( '.btn--theme' ),
	        next: document.querySelector( '.btn--next' ),
	        prev: document.querySelector( '.btn--prev' ),
	      },
	    };

	    this.world = new World( this );
	    this.cube = new Cube( this );
	    this.controls = new Controls( this );
	    this.scrambler = new Scrambler( this );
	    this.transition = new Transition( this );
	    // this.timer = new Timer( this );
	    this.preferences = new Preferences( this );
	    this.scores = new Scores( this );
	    this.storage = new Storage( this );
	    this.confetti = new Confetti( this );
	    this.themes = new Themes( this );
	    this.themeEditor = new ThemeEditor( this );

	    this.initActions();

	    this.state = STATE.Menu;
	    this.newGame = false;
	    this.saved = false;

	    this.storage.init();
	    this.preferences.init();
	    this.cube.init();
	    this.transition.init();

	    this.storage.loadGame();
	    this.scores.calcStats();

	    setTimeout( () => {

	      this.transition.float();
	      this.transition.cube( SHOW );

	      setTimeout( () => this.transition.title( SHOW ), 700 );
	      setTimeout( () => this.transition.buttons( BUTTONS.Menu, BUTTONS.None ), 1000 );

	    }, 500 );
	  }

	  initActions() {

	    let tappedTwice = false;
	    // this.game( SHOW );


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
	        
	        // this.timer.start( true );
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

	  _getScrambleFromSolution(solution) {
	    const moves = solution.split(' ');
	    const reversedAndInvertedMoves = moves.reverse().map(move => {
	      if (move.endsWith("'")) {
	        return move.slice(0, -1);
	      }
	      if (move.endsWith('2')) {
	        return move;
	      }
	      return `${move}'`;
	    });
	    return reversedAndInvertedMoves.join(' ');
	  }
	  getNewOutput(sol){
	    // The solution string is space-separated, so we can just split it.
	    // return sol.split(' ').filter(move => move !== '');
	        let newData = [];
	    [...sol].map((data,index)=>{
	      let st = '';
	      if(data == 'R'|| data == 'U'|| data == 'F'|| data == 'L'|| data == 'D'|| data == 'B'){
	        st = st+data;
	        if(sol[index+1] == `'` || sol[index+1]=='2')
	          st= st+sol[index+1];
	        console.log('data',st,data);
	        newData.push(st);
	      }
	    });
	    return newData;
	  }
	  
	  nextButtonEvent() {
	    const solutionStepsArray = this.getNewOutput(solutionSteps);
	    this.solutionStepsArray = solutionStepsArray;
	    console.log("nextButtonEvent", this.dom.buttons.next);

	    this.dom.buttons.next.onclick = event => {
	        console.log("nextButtonEvent", this.dom.buttons.next);
	        if (presentIndex >= solutionStepsArray.length) {
	          console.log('End of solution.');
	          // Optionally disable the button
	          this.dom.buttons.next.style.pointerEvents = 'none';
	          this.dom.buttons.next.style.opacity = '0.5';
	          return;
	        }
	        const presentStep = solutionStepsArray[presentIndex++];
	        this.scrambler.scramble(presentStep);
	        this.controls.scrambleCube();

	    };
	  }


	  game( show ) {

	    if ( show ) {

	      if ( ! this.saved ) {
	        presentIndex = 0; // Reset for new solution
	        this.dom.buttons.next.style.pointerEvents = 'all';
	        this.dom.buttons.next.style.opacity = '1';
	        scramble = this._getScrambleFromSolution(solutionSteps);
	        // .split(' ');
	        // const scramble = "B' D'"
	        this.scramble=scramble;
	        // const presentStep = scramble[presentIndex];
	        this.scrambler.scramble(scramble);
	        this.controls.scrambleCube();
	        console.log("steps",scramble);
	        // this.newGame = true;

	        // setTimeout(() => {
	        // // const sol = "D B" 
	        // // solutionSteps
	        // this.scrambler.scramble(solutionSteps);
	        // this.controls.scrambleCube();
	        // this.newGame = true;
	        // }, 15000);
	        this.nextButtonEvent();
	        // D L2 F L D L D' L' F' L D2 L' D2 L2 D L' D L D' L' D L D2 L' F D F' D' R' D' R D F' D F D' F' D F D' R D R' F' D F D2 B D' B' R D' R' D' U L F U' L2 D' U' L' U B D'
	      }

	      const duration = this.saved ? 0 :
	        this.scrambler.converted.length * ( this.controls.flipSpeeds[0] + 10 );

	      this.state = STATE.Playing;
	      this.saved = true;

	      this.transition.buttons( BUTTONS.None, BUTTONS.Menu );

	      this.transition.zoom( STATE.Playing, duration );
	      this.transition.title( HIDE );
	      // this.nextButtonEvent();

	      setTimeout( () => {

	        this.transition.timer( SHOW );        
	        // this.nextButtonEvent();


	      }, this.transition.durations.zoom - 1000 );

	      setTimeout( () => {

	        this.controls.enable();
	        // if ( ! this.newGame ) this.timer.start( true )

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
	      // this.timer.stop();
	      this.storage.clearGame();

	      // this.bestTime = this.scores.addScore( this.timer.deltaTime );

	      this.transition.zoom( STATE.Menu, 0 );
	      this.transition.elevate( SHOW );

	      setTimeout( () => {

	        this.transition.complete( SHOW, this.bestTime );
	        this.confetti.start();

	      }, 1000 );

	    } else {

	      this.state = STATE.Stats;
	      this.saved = false;

	      // this.transition.timer( HIDE );
	      this.transition.complete( HIDE, this.bestTime );
	      this.transition.cube( HIDE );
	      // this.timer.reset();

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
