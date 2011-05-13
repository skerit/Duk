<head>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
    <script type="text/javascript" src="duk.js"></script>
	<style type="text/css">
			p {margin: 0}
			#main {float:left;}
			#output {width: 50%}
			</style>
	<script type="text/javascript">

      var d;

      function initialize() {
		echo('Starting up');
        d = new Duk('ezel', 'hud.json'); //d = new Duk('ezel', 'hud.json', startDialog);
        d.getBlueprint('hud.json');

          var ctx = document.getElementById('ezel').getContext('2d');

      }

        function startDialog(){
			echo('Opening beginning dialog');
            r = d.openDialog(d.blueprint.screens.test);
        }
		
		function newDialog(){
            r = d.openDialog(d.blueprint.screens.test);
            r.addWidget(d.blueprint.widgets.input)
		}

	</script>
</head>
<body style="height:95%" onload="initialize()">
	<div id="container">
		<div id="main">
			<h2 class="title">Duk - Pretty dialogs in a canvas</h2>
			<canvas id="ezel" width="480" height="300" style="border: solid 1px;"></canvas><br/>
            <button onclick="newDialog()">Open dialog window</button>
            
			
        </div>
		<div id="output" style="float:right;"></div>
    </div>
</body>