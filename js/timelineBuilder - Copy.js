var debugVar;
function buildGraph() {
	var eventHistory = [];
	var purchaseHistory = [];
	var latestEvent = 0;

	for (building in buildOrder) {
		var buildingName = buildOrder[building].name;

		for (task in buildOrder[building].tasks) {
			var eventName = buildOrder[building].tasks[task].taskName;

			var eventStart = parseInt(buildOrder[building].tasks[task].taskTime);

			var eventType = taskDescription[buildingName][eventName][0];
			var eventDuration = taskDescription[buildingName][eventName][1];
			var eventMinCost = taskDescription[buildingName][eventName][2];
			var eventGasCost = taskDescription[buildingName][eventName][3];
			var eventSupCost = taskDescription[buildingName][eventName][4];
			var eventCap = taskDescription[buildingName][eventName][5];
			var eventProps = buildOrder[building].tasks[task].props;

			var eventEnd = eventStart + eventDuration;
			var buildEvent = {
				"buildingIndex" : building,
				"time" : eventStart,
				"eventType" : eventType,
				"eventSide" : "beginning",
				"minCost" : eventMinCost,
				"gasCost" : eventGasCost,
				"supCost" : eventSupCost,
				"props" : eventProps
			};
			var finishEvent = {
				"time" : eventEnd,
				"eventType" : eventType,
				"eventSide" : "end",
				"cap" : eventCap,
				"props" : eventProps
			};

			eventHistory.push(buildEvent);
			eventHistory.push(finishEvent);

			if (latestEvent < eventEnd) {
				latestEvent = eventEnd;
			}
		}
	}

	var minCount = 0;
	//  you start off w/ 50 min
	var gasCount = 0;
	//  ... and 0 gas
	var workerCount = 0;
	//  ... and 6 workers
	var gaserCount = 0;
	var muleCount = 0;
	var supCount = 0;
	//  ... and 6 consumed supply
	var totalIncome = 0;
	//  ... and 11 supply cap
	var lastMinCount = 0;
	var lastGasCount = 0;
	var lastSupCount = 0;
	var lastTotalIncome = 0;
	var baseMortgagePay = 500;
	var minPoints = [];
	var gasPoints = [];
	var supPoints = [];
	var totalAsset = [];
	var yrAsset = [];
	var dataPoints = [];
	var wkIncome = 0;
	var houseIncreaseRate = 4.0 / 52 / 100;
	var interestRate = 0.035 / 52;
	//  workers 1  through 16 harvest at 42.5 minerals a minute (/60 for per sec)
	var fixRate = 0.035 / 52;
	//  workers 1  through 16 harvest at 42.5 minerals a minute (/60 for per sec)
	var baseAssetValue = 0;
	var initialAssetVal = 0;
	for (var i = 0; i < 520; i++) {
		
		for (var j = 0; j < eventHistory.length; j++) {
			currentEvent = eventHistory[j];
			if (eventHistory[j].time == i && currentEvent.eventSide == "beginning") {
				if (currentEvent.eventType == "rate") {
					//interestRate =  parseFloat( currentEvent.props)/52/100;
					if (currentEvent.props != null) {
						var interestObj = eval('(props={' + currentEvent.props + '})');
						interestRate = parseFloat(interestObj.interestRate) / 52 / 100;
					}
				}
				if (currentEvent.eventType == "houseIncreaseRate") {
					//interestRate =  parseFloat( currentEvent.props)/52/100;
					if (currentEvent.props != null) {
						var obj = eval('(props={' + currentEvent.props + '})');
						houseIncreaseRate = parseFloat(obj.yrRate) / 52 / 100;
					}
				}
				if (currentEvent.eventType == "lumpsum") {
					if (currentEvent.props != null) {
						var lumsumObj = eval('(props={' + currentEvent.props + '})');
						minCount = minCount - parseFloat(lumsumObj.lumpsum);
						supCount = supCount - parseFloat(lumsumObj.lumpsum);
					}
				}
				//+mort pay
				if (currentEvent.eventType == "mortgage") {
					if (currentEvent.props != null) {
						var obj = eval('(props={' + currentEvent.props + '})');
						baseMortgagePay = parseFloat(obj.payment);
					}
				}
				//totalIncome
				if (currentEvent.eventType == "income") {
					if (currentEvent.props != null) {
						var obj = eval('(props={' + currentEvent.props + '})');
						wkIncome = parseFloat(obj.wkIncome);
					}
				}
				//Cash
				if (currentEvent.eventType == "cash") {
					if (currentEvent.props != null) {
						var obj = eval('(props={' + currentEvent.props + '})');
						supCount = supCount + parseFloat(obj.cash);
					}
				}
				// buy house (downpay, loan)
				if (currentEvent.eventType == "buy house") {
					if (currentEvent.props != null) {
						var obj = eval('(props={' + currentEvent.props + '})');
						minCount = parseFloat(obj.loan);
						supCount = supCount - parseFloat(obj.downpay);
						baseAssetValue = parseFloat(obj.loan) + parseFloat(obj.downpay);
					}
				}
				// sell house (no params)
				if (currentEvent.eventType == "sell house") {
					supCount = supCount + baseAssetValue * 0.95 - minCount;
					minCount = 0;
					baseAssetValue = 0;
				}
			}
		}

		if (minCount > 0) {
			minCount = minCount * (1 + interestRate) - baseMortgagePay;
			supCount = supCount + wkIncome - baseMortgagePay;
		} else {
			supCount = supCount + wkIncome;
		}
		gasCount = gasCount + 1;
		baseAssetValue = baseAssetValue * (1 + houseIncreaseRate);
		totalIncome = supCount - minCount + baseAssetValue * 0.95;
		/* gas calculation credits: http://www.starcraft2-wiki.com/guides/gameplay-guides/gas-matters */
		var efficientGasers = 0;
		var slowGasers = 0;

		if (i > 1 && i % 4 == 0) {
			minPoints.push([i - 4, lastMinCount]);
			minPoints.push([i, minCount]);
			gasPoints.push([i - 4, lastGasCount * 52 * 100]);
			gasPoints.push([i, interestRate * 52 * 100]);
			supPoints.push([i - 4, lastSupCount]);
			supPoints.push([i, supCount]);
			totalAsset.push([i - 4, lastTotalIncome]);
			totalAsset.push([i, totalIncome]);

			lastMinCount = minCount;
			lastGasCount = interestRate;
			lastSupCount = supCount;
			lastTotalIncome = totalIncome;
			dataPoints = [minPoints, gasPoints, supPoints, totalAsset]

		}
		if (i % 52 == 0) {
			if ( i == 0 ) {
				initialAssetVal = totalIncome;
			}
			var yrER = Math.exp( Math.log(totalIncome/initialAssetVal)/(i/52)) - 1;
			var dataRow = {
				Year : i / 52 + 2013,
				AssetVal : Math.round(totalIncome*100)/100,
				yrER : Math.round(yrER *100)/100
			};
			yrAsset.push(dataRow);
		}

	}

	var xTicks = [0];
	var yTicks = [];
	var y2Ticks = [];
	for (var i = 0; i <= 10; i++) {
		xTicks.push([i * 52, i]);
	}
	for (var i = 0; i < 10; i++) {
		y2Ticks.push(i)
	}

	maxMinCount = 1000000;
	MinCount = 0;
	for (var i = Math.ceil(MinCount / 100000); i < Math.ceil(maxMinCount / 100000); i++) {
		yTicks.push(i * 100000);
	}

	$("#graphDiv").html("");

	$.jqplot('graphDiv', dataPoints, {
		axes : {
			xaxis : {
				ticks : xTicks
			},
			yaxis : {
				min : 200000,
				ticks : yTicks
			},
			y2axis : {
				showTicks : false,
				tickOptions : {
					showGridline : false
				},
				ticks : y2Ticks
			}
		},
		highlighter : {
			show : true,
			showTooltip : true,
			// show a tooltip with data point values.
			tooltipLocation : 'nw',
			// location of tooltip: n, ne, e, se, s, sw, w, nw.
			tooltipAxes : 'both',
			// which axis values to display in the tooltip, x, y or both.
			lineWidthAdjust : 2.5 // pixels to add to the size line stroking the data point marker
		},
		series : [{
			label : 'Mortgage',
			color : '#4bb2c5',
			markerOptions : {
				show : true,
				size : 2
			}
		}, {
			label : 'Interest Rate',
			color : '#00ff00',
			markerOptions : {
				show : true,
				size : 2
			},
			yaxis : 'y2axis'
		}, {
			label : 'Cash',
			color : '#ff5800',
			markerOptions : {
				show : true,
				size : 2
			}
		}, {
			label : 'Total Asset',
			color : '#EAA228',
			markerOptions : {
				show : true,
				size : 2
			}
		}],
		seriesDefaults : {
			//pointLabels: { show: true },
			lineWidth : 1 //width of line in pixels
		},
		legend : {
			show : true,
			location : 'nw'
		}
	});
	buildAssetTbl(yrAsset);
}

function buildAssetTbl(tbl) {
	//dataTblContainer
	var tblInitialVal = "<div><table class=\"datatbl\"><tbody class=\"header\"><tr><th>Year</th><th>Asset</th><th>ER</th></tr></tbody><tbody id=\"dataTblContent\"></tbody></table></div>";
	$("#dataTblContainer").html(tblInitialVal);
	$("#dataTblTemplate").tmpl(tbl).appendTo("#dataTblContent");
}
