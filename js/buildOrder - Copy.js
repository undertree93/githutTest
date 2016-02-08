var buildOrder = [{
	"name" : "Environment",
	"tasks" : [{
		"taskTime" : 0,
		"taskName" : "HouseRate",
		"props" : "yrRate:2.0",
		"blockName" : "HousePrice"
	}, {
		"taskTime" : 91,
		"taskName" : "Rate",
		"props" : "interestRate:5.0",
		"blockName" : "Interest Hike"
	}]
},  {
	"name" : "House",
	"tasks" : []
}];