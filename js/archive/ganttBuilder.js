/*
 Based off of:

 /*
 jQuery.ganttView v.0.8.2
 Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
 MIT License Applies
 */

/*
 Options
 -----------------
 data: object
 start: date
 duration: date
 cellWidth: number
 cellHeight: number
 slideWidth: number
 behavior: {
 clickable: boolean,
 draggable: boolean,
 resizable: boolean,
 onClick: function,
 onDrag: function,
 onResize: function
 }
 */

(function($) {
	$.fn.ganttView = function(options) {

		var els = this;
		var defaults = {
			cellWidth : 21,
			cellHeight : 31,
			slideWidth : 400,
			vHeaderWidth : 100
		};

		var opts = $.extend(true, defaults, options);
		var minutes = Chart.getYears(opts.start, opts.end);

		els.each(function() {

			var container = $(this);
			var div = $("<div>", {
				"class" : "ganttview"
			});

			Chart.addVtHeader(div, opts.data, opts.cellHeight);
			Chart.addBuildingAdder(div);
			Chart.addSaverLoader(div);
			//Chart.addDataTbl(div);

			var slideDiv = $("<div>", {
				"class" : "ganttview-slide-container",
				"css" : {
					"width" : opts.slideWidth + "px"
				}
			});
			Chart.addHzHeader(slideDiv, minutes, opts.cellWidth);
			Chart.addGrid(slideDiv, opts.data, minutes, opts.cellWidth, opts.cellHeight);

			Chart.addBlockContainers(slideDiv, opts.data, opts.cellHeight);

			Chart.addBlocks(slideDiv, opts.data, opts.cellWidth, opts.cellHeight, opts.start);

			div.append(slideDiv);
			container.html(div);

			var w = $("div.ganttview-vtheader", container).outerWidth() + $("div.ganttview-slide-container", container).outerWidth();
			container.css("width", (w + 2) + "px");

			Chart.applyLastClass(container);
			Behavior.bindBlockDrag(container, opts.cellWidth, opts.start);
		});
		buildGraph();
	};

	var Chart = {

		getYears : function(start, end) {
			var years = [];
			var total_time = end - start;
			var total_minutes = Math.floor(total_time / 52);
			for (var i = 0; i <= total_minutes; i++) {
				years.push(2015 + i);
			}
			return years;
		},

		addVtHeader : function(div, data, cellHeight) {
			var headerDiv = $("<div>", {
				"class" : "ganttview-vtheader"
			});
			for (var i = 0; i < data.length; i++) {
				var itemDiv = $("<div>", {
					"class" : "ganttview-vtheader-item",
					"css" : {
						"height" : (cellHeight + 1) + "px"
					}
				});
				var selector = $("<select>");
				var lastTask = {};
				if (buildOrder[i].tasks.length > 0) {
					lastTask = _.max(buildOrder[i].tasks, function(task) {
						return task.taskTime;
					});
				}

				for (taskName in taskDescription[data[i].name]) {
					var isSelected = (lastTask.taskName == taskName ) ? "selected" : "";
					dom_option = $("<option>", {
						"value" : taskName,
						"selected" : isSelected
					}).html(taskName);
					selector.append(dom_option);
				}
				var myString = $('<div/>').html("+ Task &rarr;").text();
				var input = $("<input>", {
					"type" : "submit",
					"value" : myString,
					"id" : "for_row_" + i
				});
				input.click(function() {
					var newTask = $(this).siblings('select').attr('value');
					var rowIndex = parseInt($(this).attr('id').replace("for_row_", ""));
					var taskType = taskDescription[buildOrder[rowIndex].name][newTask][0];

					var lastEventEnd = 0;
					if (buildOrder[rowIndex].tasks.length > 0) {
						var lastEventName = _.max(buildOrder[rowIndex].tasks, function(task) {
							return task.taskTime;
						}).taskName;
						var lastEventStart = _.max(buildOrder[rowIndex].tasks, function(task) {
							return task.taskTime;
						}).taskTime;
						var lastEventDuration = taskDescription[buildOrder[rowIndex].name][lastEventName][1];
						lastEventEnd = lastEventStart + lastEventDuration;
					}
					buildOrder[rowIndex].tasks.push({
						taskTime : lastEventEnd,
						taskName : newTask
					});

					if (taskType == "addon") {
						var newBuildingName = newTask;
						var newBuildingObj = {
							name : newBuildingName,
							tasks : []
						};
						buildOrder.splice(rowIndex + 1, 0, newBuildingObj);
					}

					ganttTheData();
				});
				var controlPad = $('<div class="control_pad">');
				var moveUp = '<span class="building_mover up">Move Up</span>';
				var moveDown = '<span class="building_mover down">Move Down</span>';
				if (i != 0) {
					controlPad.append(moveUp);
				}
				if (i != buildOrder.length - 1) {
					controlPad.append(moveDown);
				}

				var closeButton = $("<div>", {
					"class" : "ganttview-vtheader-item-close"
				}).text("x");

				closeButton.click(function() {
					var toRemove = $(this).parent().data("vtHeaderId");
					delete buildOrder[toRemove];
					buildOrder = _.compact(buildOrder);
					ganttTheData();
				});

				itemDiv.append($("<div>", {
					"class" : "ganttview-vtheader-item-name"
				}).append(data[i].name)).append(selector).append(input).append(closeButton).append(controlPad);
				var vtHeaderId = i;
				itemDiv.data("vtHeaderId", vtHeaderId);
				headerDiv.append(itemDiv);
			}
			div.append(headerDiv);
		},

		addBuildingAdder : function(div) {
			var buildingAdder = $('<div>', {
				"id" : "building_adder"
			});
			var buildingAdderOption = $("<select>");
			for (building in taskDescription) {
				var buildingOption = $("<option>", {
					"value" : building
				}).html(building);
				buildingAdderOption.append(buildingOption);
			}
			var myString = $('<div/>').html("+ Building &darr;").text();
			var buildingAdderInput = $("<input>", {
				"type" : "submit",
				"value" : myString
			});
			buildingAdderInput.click(function() {
				var newBuildingName = $(this).siblings('select').attr("value");
				var newBuildingObj = {
					name : newBuildingName,
					tasks : []
				};
				buildOrder.push(newBuildingObj);
				ganttTheData();
			});
			buildingAdder.append(buildingAdderOption).append(buildingAdderInput);
			div.append(buildingAdder);
		},
		addSaverLoader : function(div) {
			var saverLoaderContainer = $('<div id="buildOrderSaverLoaderContainer">');
			var saver = "<label for='buildOrderSaverLoader'>Export / Import Text:</label><br /><textarea type='text' id='buildOrderSaverLoader' />";

			var myString = $('<div/>').html("Chart &rarr; Text").text();
			var getterInput = $("<input>", {
				"type" : "submit",
				"value" : myString,
				"id" : "get_build_order"
			});
			getterInput.click(function() {
				$("#buildOrderSaverLoader").html(JSON.stringify(buildOrder));
			});

			var myString = $('<div/>').html("Text &rarr; Chart").text();
			var setterInput = $("<input>", {
				"type" : "submit",
				"value" : myString,
				"id" : "load_build_order"
			});
			setterInput.click(function() {
				buildOrder = JSON.parse($("#buildOrderSaverLoader").val());
				ganttTheData();
			});
			var dataTblContainer = $('<div id="dataTblContainer">');
			var content = "Test";
			dataTblContainer.append(content);
			saverLoaderContainer.append(saver).append(getterInput).append("<br />").append(setterInput).append("<br/>").append(dataTblContainer);
			div.append(saverLoaderContainer);
		},

		addHzHeader : function(div, minutes, cellWidth) {
			var headerDiv = $("<div>", {
				"class" : "ganttview-hzheader"
			});
			var minutesDiv = $("<div>", {
				"class" : "ganttview-hzheader-minutes"
			});
			var secondsDiv = $("<div>", {
				"class" : "ganttview-hzheader-seconds"
			});
			var chunkWidth = cellWidth * 13;
			var totalW = 0;
			for (var i = 0; i < 12; i++) {
				if (minutes[i] != undefined) {
					var w = 52 * cellWidth;
					totalW = totalW + w;
					minutesDiv.append($("<div>", {
						"class" : "ganttview-hzheader-minute",
						"css" : {
							"width" : (w - 1) + "px"
						}
					}).append(minutes[i]));
					for (var j = 0; j < 52; j = j + 13) {
						secondsDiv.append($("<div>", {
							"class" : "ganttview-hzheader-second",
							"width" : (chunkWidth - 1)
						}).append(j));
					}
				}
			}
			minutesDiv.css("width", totalW + "px");
			secondsDiv.css("width", totalW + "px");
			headerDiv.append(minutesDiv).append(secondsDiv);
			div.append(headerDiv);
		},

		addGrid : function(div, data, minutes, cellWidth, cellHeight) {
			var w = "width=" + buildOrder.length * cellWidth + "px";
			var gridDiv = $("<div>", {
				"class" : "ganttview-grid",
				"css" : w
			});
			var rowDiv = $("<div>", {
				"class" : "ganttview-grid-row",
				"css" : w
			});
			var cellDivs = "";
			for (i in minutes) {
				for (var j = 0; j < 52; j++) {
					var cellClass = "ganttview-grid-row-cell";
					if (j % 13 == 12) {
						cellClass = cellClass + " darker";
					}
					var cellDiv = "<div class='" + cellClass + "'style='width:" + (cellWidth - 1) + "px; height: " + cellHeight + "px;'></div>";
					cellDivs = cellDivs + cellDiv;
				}
			}
			rowDiv.append(cellDivs);
			for (var i = 0; i < data.length; i++) {
				gridDiv.append(rowDiv.clone());
			}
			div.append(gridDiv);
		},

		addBlockContainers : function(div, data, cellHeight) {
			var blocksDiv = $("<div>", {
				"class" : "ganttview-blocks"
			});
			for (var i = 0; i < data.length; i++) {
				blocksDiv.append($("<div>", {
					"class" : "ganttview-block-container",
					"height" : cellHeight - 3
				}));
			}
			div.append(blocksDiv);
		},

		addBlocks : function(div, data, cellWidth, cellHeight, start) {
			var rows = $("div.ganttview-blocks div.ganttview-block-container", div);
			for (var i = 0; i < data.length; i++) {/* for each structure */
				var building = data[i];
				for (taskIndex in building.tasks) {
					var currentTask = building.tasks[taskIndex];
					var taskDetails = taskDescription[building.name][currentTask.taskName];
					var type = taskDetails[0];
					var size = taskDetails[1];
					var offset = currentTask.taskTime;
					var block = $("<div>", {
						"class" : "ganttview-block tasks_" + type,
						"title" : currentTask.props,
						"css" : {
							"width" : ((size * cellWidth) - 2) + "px",
							"height" : (cellHeight - 6) + "px",
							"left" : ((offset * cellWidth) - 1) + "px",
						}
					});
					var blockName;
					if (currentTask.hasOwnProperty("blockName")) {
						blockName = currentTask.blockName;
					} else {
						blockName = currentTask.taskName;
					}
					block.append($("<div>", {
						"class" : "ganttview-block-text context-menu-block"
					}).text(blockName));
					block.width(getStrWidth("MS Reference Sans Serif", "0.8em", blockName) + 20);
					return_times = getFriendlyTimes(offset, offset + size);

					var closeButton = $("<div>", {
						"class" : "ganttview-block-close"
					}).text("x");
					closeButton.click(function() {
						var toRemove = $(this).parent().data("blockId").split("_");
						var xBuilding = buildOrder[toRemove[0]];
						var xTask = buildOrder[toRemove[0]].tasks[toRemove[1]];
						var newBuildingTasks = _.reject(xBuilding.tasks, function(rejTask) {
							return (rejTask.taskName == xTask.taskName) && (rejTask.taskTime == xTask.taskTime);
						});
						buildOrder[toRemove[0]].tasks = newBuildingTasks;
						ganttTheData();
					});

					block.append($("<div>", {
						"class" : "ganttview-block-start"
					}).text(return_times[0]));
					/* 	This section is for start and stop sign of a block
					block.append($("<div>", { "class": "ganttview-block-end" }).text(return_times[1]));
					*/
					block.append(closeButton);
					var blockId = i + "_" + taskIndex;

					block.data("blockId", blockId);

					$(rows[i]).append(block);
				}
			}
		},

		applyLastClass : function(div) {
			$("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
			$("div.ganttview-hzheader-seconds div.ganttview-hzheader-second:last-child", div).addClass("last");
			$("div.ganttview-hzheader-minutes div.ganttview-hzheader-minute:last-child", div).addClass("last");
		}
	};

	var Behavior = {

		bindBlockDrag : function(div, cellWidth, startDate) {
			$("div.ganttview-block", div).liveDraggable({
				axis : "x",
				grid : [cellWidth, cellWidth],
				stop : function() {
					var block = $(this);
					var blockId = block.data("blockId");
					Behavior.updateDataAndRedraw(div, block, cellWidth, blockId);
				}
			});
		},

		updateDataAndRedraw : function(div, block, cellWidth, blockId) {
			var blockIdComponents = blockId.split("_");
			var blockBuilding = blockIdComponents[0];
			var blockTimeSig = blockIdComponents[1];

			var container = $("div.ganttview-slide-container", div);
			var scroll = container.scrollLeft();
			var offset = block.offset().left - container.offset().left - 1 + scroll;

			// Set new start time
			var newStart = Math.round(offset / cellWidth);

			buildOrder[blockBuilding]["tasks"][blockTimeSig].taskTime = newStart;
			ganttTheData();
		},
		obtainProps : function(blockId) {
			var blockIdComponents = blockId.split("_");
			var blockBuilding = blockIdComponents[0];
			var blockTimeSig = blockIdComponents[1];

			return buildOrder[blockBuilding]["tasks"][blockTimeSig].props;
		},
		setProps : function(blockId, props) {
			var blockIdComponents = blockId.split("_");
			var blockBuilding = blockIdComponents[0];
			var blockTimeSig = blockIdComponents[1];

			buildOrder[blockBuilding]["tasks"][blockTimeSig].props = props;
		},
		obtainBlockName : function(blockId) {
			var blockIdComponents = blockId.split("_");
			var blockBuilding = blockIdComponents[0];
			var blockTimeSig = blockIdComponents[1];
			if (! buildOrder[blockBuilding]["tasks"][blockTimeSig].hasOwnProperty("blockName"))
				return buildOrder[blockBuilding]["tasks"][blockTimeSig].taskName;
			return buildOrder[blockBuilding]["tasks"][blockTimeSig].blockName;
		},
		setBlockName : function(blockId, blockName) {
			var blockIdComponents = blockId.split("_");
			var blockBuilding = blockIdComponents[0];
			var blockTimeSig = blockIdComponents[1];

			buildOrder[blockBuilding]["tasks"][blockTimeSig].blockName = blockName;
		}
	};
	$.contextMenu({
		selector : '.context-menu-block',
		items : {
			blockName : {
				name : "Event Name",
				type : 'text',
				value : "Hello World"
			},
			properties : {
				name : "Properties",
				type : 'textarea',
				value : "Hello World",
				height : 40
			}
		},
		events : {
			show : function(opt) {
				var block = $(this).parent();
				var blockId = block.data("blockId");
				var $this = this;
				$.contextMenu.getInputValues(opt, $this.data());
				$this.data("blockName", Behavior.obtainBlockName(blockId));
				$this.data("properties", Behavior.obtainProps(blockId));
				$.contextMenu.setInputValues(opt, this.data());
			},
			hide : function(opt) {
				var block = $(this).parent();
				var blockId = block.data("blockId");
				var $this = this;
				$.contextMenu.getInputValues(opt, $this.data());
				var props = $this.data("properties");
				Behavior.setProps(blockId, props);
				var blockName = $this.data("blockName");
				Behavior.setBlockName(blockId, blockName);
				ganttTheData();
			}
		}
	});

})(jQuery);

function ganttTheData() {
	$("#ganttChartDiv").html("");
	//$.contextMenu( 'destroy' );
	$(function() {
		$("#ganttChartDiv").ganttView({
			data : buildOrder,
			start : 0,
			end : 480,
			slideWidth : 2175,
			cellWidth : 4,
			cellHeight : 40
		});
	});
}

function getFriendlyTimes(start_time, end_time) {
	var return_times = [];
	if (start_time % 52 < 10) {
		start_lead = "0";
	} else {
		start_lead = "";
	}
	if (end_time % 52 < 10) {
		end_lead = "0";
	} else {
		end_lead = "";
	}
	var friendly_start = Math.floor(start_time / 52) + "." + start_lead + (start_time % 52);
	var friendly_end = Math.floor(end_time / 52) + "." + end_lead + (end_time % 52);

	return_times.push(friendly_start);
	return_times.push(friendly_end);

	return return_times;
}

function getStrWidth(fontFamily, fontSize, input) {     
	var div = document.createElement("div");     
	div.style.position = "absolute";     
	div.style.visibility = "hidden";     
	div.style.fontFamily = fontFamily;     
	div.style.fontSize = fontSize;     
	div.innerHTML = input;     
	document.body.appendChild(div);     
	var width = div.offsetWidth;     
	document.body.removeChild(div);     
	return(width); 
} 

(function($) {
	jQuery.fn.liveDraggable = function(opts) {
		this.live("mouseover", function() {
			if (!$(this).data("init")) {
				$(this).data("init", true).draggable(opts);
			}
		});
	};
})(jQuery);


$(".building_mover").live('click', function() {
	var $this = $(this);
	var moveModifier = ($this.hasClass('up')) ? -1 : 1;
	var minimum = 0;
	var maximum = buildOrder.length - 1;
	var oldId = parseInt($this.parent().parent().data("vtHeaderId"));
	var buildingInfo = buildOrder[oldId];
	buildOrder.splice(oldId, 1);
	buildOrder.splice((oldId + moveModifier), 0, buildingInfo);
	ganttTheData();
});
