const SELL_TRANSACTION_PERCENT = 0.05;
const BUY_TRANSACTION_PERCENT = 0.02;

var eventHistory = [];
var dataPoints = [];
var buildVarAry = [];
var debtCount = 0;
var assetCount = 0;
var wealthCount = 0;
var housingMarketIncrease = 0;
var cashMarketIncrease = 0;
var cashCount = 0;
var grid_actions = {
	'Environment' : {
		'OneTime' : function(evt) {
			cashCount += getVal(evt, "cash");
			housingMarketIncrease = getVal(evt, "housingMarketIncrease") != 0 ? getVal(evt, "housingMarketIncrease") : housingMarketIncrease;
			cashMarketIncrease = getVal(evt, "cashMarketIncrease") != 0 ? getVal(evt, "cashMarketIncrease") : cashMarketIncrease;
		},
		'Routine' : function(evt) {
			buildVarAry[evt.buildingIndex].wkIncome = getVal(evt, "wkSalary") != 0 ? getVal(evt, "wkSalary") : buildVarAry[evt.buildingIndex].wkIncome;
			buildVarAry[evt.buildingIndex].wkCost = getVal(evt, "wkCost") != 0 ? getVal(evt, "wkCost") : buildVarAry[evt.buildingIndex].wkCost;
		}
	},
	'House' : {
		'BuyHouse' : function(evt) {

			var i = evt.buildingIndex;
			buildVarAry[i].wkMortgage = getVal(evt, "wkPay") != 0 ? getVal(evt, "wkPay") : buildVarAry[i].wkMortgage;
			buildVarAry[i].wkInterest = getVal(evt, "yrInterest") != 0 ? getVal(evt, "yrInterest") / 100 / 52 : buildVarAry[i].wkInterest;
			buildVarAry[i].debt = getVal(evt, "Loan") != 0 ? getVal(evt, "Loan") : buildVarAry[i].debt;
			buildVarAry[i].asset = getVal(evt, "TtlVal") != 0 ? getVal(evt, "TtlVal") : buildVarAry[i].asset;
			cashCount  = cashCount - buildVarAry[i].asset * BUY_TRANSACTION_PERCENT - (buildVarAry[i].asset - buildVarAry[i].debt);  
		},
		'SellHouse' : function(evt) {
			var i = evt.buildingIndex;
			buildVarAry[i].wkMortgage = 0;
			buildVarAry[i].wkInterest = getVal(evt, "yrInterest") != 0 ? getVal(evt, "yrInterest") / 100 / 52 : buildVarAry[i].wkInterest;
			cashCount += buildVarAry[i].asset *SELL_TRANSACTION_PERCENT - buildVarAry[i].debt ;
			buildVarAry[i].debt = 0;
			buildVarAry[i].asset = 0;
		},
		'RentHouse' : function(evt) {
			var i = evt.buildingIndex;
			buildVarAry[i].wkIncome = getVal(evt, "wkIncome") != 0 ? getVal(evt, "wkIncome") : buildVarAry[evt.i].wkIncome;
			buildVarAry[i].wkCost = getVal(evt, "wkCost") != 0 ? getVal(evt, "wkCost") : buildVarAry[evt.i].wkCost;
		},
		'OneTime' : function(evt) {
			var i = evt.buildingIndex;
			if ( getVal(evt, "lumpsum") != 0) {
				buildVarAry[i].asset += getVal(evt, "lumpsum");
				cashCount -= getVal(evt, "lumpsum");
			}
			if ( getVal(evt, "yrInterest") != 0) {
				buildVarAry[i].wkInterest = getVal(evt, "yrInterest")/100/52;
			}
		},
	}
};

function initVal() {
	eventHistory = [];
	dataPoints = [];
	buildVarAry = [];
	debtCount = 0;
	assetCount = 0;
	wealthCount = 0;
	cashCount =0;
}

function getEventHistory() {

	for (building in buildOrder) {
		var buildingName = buildOrder[building].name;
		var buildVar = {
			debt : 0,
			asset : 0,
			wkIncome : 0,
			wkCost : 0,
			wkInterest : 0,
			wkMortgage : 0
		};
		buildVarAry.push(buildVar);
		for (task in buildOrder[building].tasks) {
			var eventName = buildOrder[building].tasks[task].taskName;

			var eventStart = parseInt(buildOrder[building].tasks[task].taskTime);
			var eventType = taskDescription[buildingName][eventName][0];
			var eventProps = buildOrder[building].tasks[task].props;

			var buildEvent = {
				"buildingIndex" : building,
				"eventName" : buildingName,
				"eventType" : eventType,
				"time" : eventStart,
				"props" : eventProps
			};

			eventHistory.push(buildEvent);
		}
	}
}

function getVal(evt, propName) {
	if (evt != null && evt.props != null) {
		var obj = eval('(props={' + evt.props + '})');
		if (obj[propName] != null) {
			return parseFloat(obj[propName]);
		}
	}
	return 0;
}

function sumAll() {
	debtCount = 0;
	assetCount = 0;
	cashCount = cashCount * (1 + cashMarketIncrease / 52 / 100);
	for (var i = 0; i < buildVarAry.length; i++) {
		cashCount += buildVarAry[i]["wkIncome"] - buildVarAry[i]["wkCost"] - buildVarAry[i]["wkMortgage"];
		buildVarAry[i]["debt"] += buildVarAry[i]["wkInterest"] * buildVarAry[i]["debt"] - buildVarAry[i]["wkMortgage"];
		buildVarAry[i]["asset"] = buildVarAry[i]["asset"] * (1 + housingMarketIncrease / 52 / 100);
		debtCount += buildVarAry[i]["debt"];
		assetCount += buildVarAry[i]["asset"];
	}
	wealthCount = cashCount + assetCount - debtCount;
}

function buildGraph() {

	initVal();
	getEventHistory();

	var lastCash = 0;
	var lastDebt = 0;
	var lastAsset = 0;
	var lastWealth = 0;

	var cashPoints = [];
	var debtPoints = [];
	var assetPoints = [];
	var wealthPoints = [];

	var yrAsset = [];

	for (var i = 0; i < 520; i++) {

		for (var j = 0; j < eventHistory.length; j++) {
			evt = eventHistory[j];
			if (evt.time == i && grid_actions[evt.eventName][evt.eventType] != null) {
				grid_actions[evt.eventName][evt.eventType](evt);
			}
		}

		sumAll();
		if (i > 1 && i % 4 == 0) {

			cashPoints.push([i - 4, lastCash]);
			cashPoints.push([i, cashCount]);
			debtPoints.push([i - 4, lastDebt]);
			debtPoints.push([i, debtCount]);
			assetPoints.push([i - 4, lastAsset]);
			assetPoints.push([i, assetCount]);
			wealthPoints.push([i - 4, lastWealth]);
			wealthPoints.push([i, wealthCount]);

			lastCash = cashCount;
			lastDebt = debtCount;
			lastAsset = assetCount;
			lastWealth = wealthCount;

		}
		if (i % 52 == 0) {
			if (i == 0) {
				initialAssetVal = wealthCount;
			}
			var yrER = Math.exp(Math.log(wealthCount / initialAssetVal) / (i / 52)) - 1;
			var dataRow = {
				Year : i / 52 + 2013,
				AssetVal : Math.round(wealthCount * 100) / 100,
				yrER : Math.round(yrER * 100) / 100
			};

			yrAsset.push(dataRow);
		}

	}
	dataPoints = [cashPoints, debtPoints, assetPoints, wealthPoints];

	buildGraphDiv(dataPoints);
	buildAssetTbl(yrAsset);
}

function buildGraphDiv(datapoints) {

	var xTicks = [0];
	var yTicks = [];
	var y2Ticks = [];
	for (var i = 0; i <= 10; i++) {
		xTicks.push([i * 52, i]);
	}
	for (var i = 0; i < 10; i++) {
		y2Ticks.push(i);
	}

	maxcashCount = 3000000;
	cashCount = 0;
	for (var i = Math.ceil(cashCount / 100000); i < Math.ceil(maxcashCount / 100000); i++) {
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
			label : 'Cash',
			color : '#4bb2c5',
			markerOptions : {
				show : true,
				size : 2
			}
		}, {
			label : 'Debt',
			color : '#00ff00',
			markerOptions : {
				show : true,
				size : 2
			}

		}, {
			label : 'Asset',
			color : '#ff5800',
			markerOptions : {
				show : true,
				size : 2
			}
		}, {
			label : 'Wealth',
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

}

function buildAssetTbl(tbl) {
	//dataTblContainer
	var tblInitialVal = "<div><table class=\"datatbl\"><tbody class=\"header\"><tr><th>Year</th><th>Asset</th><th>ER</th></tr></tbody><tbody id=\"dataTblContent\"></tbody></table></div>";
	$("#dataTblContainer").html(tblInitialVal);
	$("#dataTblTemplate").tmpl(tbl).appendTo("#dataTblContent");
}
