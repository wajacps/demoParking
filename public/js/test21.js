// JavaScript Document
var wsUri = "ws://58.26.233.177:8082/ws/ISSEF/parking/data";
var websocket;

var myWS;

var svgNS = "http://www.w3.org/2000/svg";
	
function init() {
	getAvailableCount();
	getParkingBays();
	testWebSocket();
}

function testWebSocket() {
	websocket = new WebSocket(wsUri); 
	websocket.onopen = function(evt) { onOpen(evt) }; 
	websocket.onclose = function(evt) { onClose(evt) }; 
	websocket.onmessage = function(evt) { onMessage(evt) };
	websocket.onerror = function(evt) { onError(evt) };
	
	myWS = new WebSocket("ws://58.26.233.177:8082/parking/simulate");
}

function onOpen(evt) {
	console.log('connected');
	websocket.send(Date.now().toString(), {mask: true});
}

function onClose(evt) {
	console.log('disconnected');
	setTimeout(testWebSocket,1000);
}

function onMessage(evt) {
	console.log("evt: "+evt.data);
	var obj = evt.data;
	chooseWisely(obj);
}

function chooseWisely(data) {
	console.log("chooseWisely: " + data);
	var msg = JSON.parse(data);
	if (msg.topic == "bays") {
		console.log("chooseWisely: Updating bays");
		updateParkingLot(msg);
	} else if (msg.topic == "count") {
		console.log("chooseWisely: Updating count");
		updateCount(msg);
	}
	else{
		console.log("chooseNotSoWiseLaaa");
	}
}

function onError(evt) {
	console.log('Error '+evt.data);
}

function getAvailableCount() {
	var parkingAPI  = "http://58.26.233.177:8082/api/ISSEF/parking/available/count";
	$.ajax({
		type: "GET",
		url: parkingAPI,
		contentType: 'application/json',
		xhrFields: {
		withCredentials: false
		},
		headers: {
		},
		success: function(data) {
			updateCount(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus+"\r\nstatus: "+jqXHR.status+"\r\ncause: "+errorThrown);
		},
	});
}

function getParkingBays() {
	var parkingAPI  = "http://58.26.233.177:8082/api/ISSEF/parking/bays";
	var rowList = [];
	$.ajax({
		type: "GET",
		url: parkingAPI,
		contentType: 'application/json',
		xhrFields: {
		withCredentials: false
		},
		headers: {
		},
		success: function(data) {
			var json = data["Data"],
				i = 1;
				
				// TODO: Harris need to update the status of each bay here
				$.each( json, function( key, val ) {
					$("#" + val._id).attr("class", val.state);
				
					// Update title (for tooltip)
					configToolTip (val);
				});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus+"\r\nstatus: "+jqXHR.status+"\r\ncause: "+errorThrown);
		},
	});
}

function updateParkingLot(data) {
	var val = data.Data.shift();
	
	// Update the tooltip
	$("#" + val._id).attr("class", "Updated" + val.state);
	$("#" + val._id).data('tooltipsy').destroy();
	configToolTip (val);
}

function updateCount(data) {
	var val = data.Data.shift();

	// TODO: Display the count
}

// Populate the Tooltip
function configToolTip (data)
{
	// if dialog element is present, destroy it
	var el = document.getElementById("dialog" + data._id);
	if(el)
	{
		el.parentNode.removeChild(el);	
	}
	
	// Create a new element
	var myDialog = document.createElement("myDialog");
	myDialog.setAttribute("id", "dialog" + data._id);
	
	
	if(data.state == "Occupied")
	{
	myDialog.innerHTML = '<table border="1" cellspacing="0"><tr><td class="col1">Lot</td><td>' + data._id + '</td></tr><tr><td class="col1">Status</td><td>' + data.state + '</td></tr><tr><td class="col1">Car Reg #</td><td>ABC1234</td></tr><tr><td class="col1">Since</td><td>' + jQuery.timeago(data.last_update) + '</td></tr></table>';
	}
	else if(data.state == "Reserved")
	{
		myDialog.innerHTML = '<table border="1" cellspacing="0"><tr><td class="col1">Lot</td><td>' + data._id + '</td></tr><tr><td class="col1">Status</td><td>' + data.state + '</td></tr><tr><td class="col1">Car Reg #</td><td>n/a</td></tr><tr><td class="col1">Since</td><td>' + jQuery.timeago(data.last_update) + '</td></tr></table>';
	}
	else
	{
	myDialog.innerHTML = '<table border="1" cellspacing="0"><tr><td class="col1">Lot</td><td>' + data._id + '</td></tr><tr><td class="col1">Status</td><td>' + data.state + '</td></tr><tr><td class="col1">Since</td><td>' + jQuery.timeago(data.last_update) + '</td></tr><tr><td class="col1">Task</td><td><input type="button" value="Reserve" title="Reserve" onClick="onclickReserve(\'' + data._id + '\')" /></td></tr></table>';	
	}
	document.body.appendChild (myDialog);

	$("#dialog" + data._id).dialog({
		autoOpen: false,
		modal: true,
		title: data._id,
	});
	
	// Create the tooltip
	$("#" + data._id).attr("title", data._id);
	$("#" + data._id).tooltipsy ({
		alignTo: "element",
		delay: 0});
	
	// Create event handler for click
	$("#" + data._id).click(function(e) {
        $("#dialog" + data._id).dialog("open");
    });
}

function onclickReserve(el)
{
	$.ajax({
		type: "GET",
		url: "api?bay=" + el,
		contentType: "application/json",
		success: function(){
			// Modify the structure of data
			$("#dialog" + el).dialog("close");
			$("#" + el).attr("class", "Reserved");

			configToolTip({
				_id: el,
				state: "Reserved",
				last_update: $.now()
			});
			$("#dialog" + el).dialog("open");
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log(textStatus+"\r\nstatus: "+jqXHR.status+"\r\ncause: "+errorThrown);
			alert("Failed to RESERVE for Bay " + el);
		}
	});
}

function onclickSimulateIN (id)
{
	var mydata = {'lot':id, 'action':'in'};
	myWS.send (JSON.stringify(mydata)); 
	
	$("#dialog" + id).dialog("close");
	$("#" + id).attr("class", "Occupied");
	createLM3Dialog (id);		
	$("#dialog" + id).dialog("open");
}

function onclickSimulateOUT (id)
{
	var mydata = {'lot':id, 'action':'out'};
	myWS.send (JSON.stringify(mydata)); 

	
	$("#dialog" + id).dialog("close");
	$("#" + id).attr("class", "Empty");
	createLM3Dialog (id);
	$("#dialog" + id).dialog("open");		
}

function createLM3Dialog(id)
{
	// if dialog element is present, destroy it
	var date = new Date();
	var curTimestamp = date.getTime();

	var el = document.getElementById("dialog" + id);
	if(el)
	{
		el.parentNode.removeChild(el);	
	}
	
	// Create a new element
	var myDialog = document.createElement("myDialog");
	myDialog.setAttribute("id", "dialog" + id);
	
	
	
	
	if($("#" + id).attr("class") == "Occupied")
	{
	myDialog.innerHTML = '<table border="1" cellspacing="0"><tr><td class="col1">Lot</td><td>' + id + '</td></tr><tr><td class="col1">Status</td><td>Occupied</td></tr><tr><td class="col1">Car Reg #</td><td>ABC1234</td></tr><tr><td class="col1">Since</td><td>' + jQuery.timeago(curTimestamp) + '</td></tr><tr><td class="col1">Action</td><td><input type="button" value="Simulate OUT" title="OUT" onClick="onclickSimulateOUT(\'' + id + '\')" /></td></tr></table>';
	}
	else
	{
	myDialog.innerHTML = '<table border="1" cellspacing="0"><tr><td class="col1">Lot</td><td>' + id + '</td></tr><tr><td class="col1">Status</td><td>Empty</td></tr><tr><td class="col1">Since</td><td>' + jQuery.timeago(curTimestamp) + '</td></tr><tr><td class="col1">Action</td><td><input type="button" value="Simulate IN" title="IN" onClick="onclickSimulateIN(\'' + id + '\')" /></td></tr></table>';	
	}
	document.body.appendChild (myDialog);

	$("#dialog" + id).dialog({
		autoOpen: false,
		modal: true,
		title: id,
	});
	
	// Create the tooltip
	$("#" + id).attr("title", id);
	$("#" + id).tooltipsy ({
		alignTo: "element",
		delay: 0});
	
	// Create event handler for click
	$("#" + id).click(function(e) {
        $("#dialog" + id).dialog("open");
    });
	
	
}

// Initialize the MCM Parking Lot
function configureLM3()
{
	var i;
	var myId;
	
	for(i=1;i<=7;i++)
	{
		myId = "LM3S0" + i;		

		// By default, put all lot to EMPTY
		$("#" + myId).attr("class", "Empty");
		createLM3Dialog (myId);
		
		
	}
}


$(function(){
	// TODO: OnLoad
	window.addEventListener("load", init, false);
	
	var date = new Date();
	var curTimestamp = date.toLocaleString();
//	var curTimestamp = date.getTime();
	
	$("#testTable").attr("title", curTimestamp);
//	$("#testTable").html(curTimestamp);
	$("#testTable").timeago();
	
	// Add the LM3
	configureLM3();

});