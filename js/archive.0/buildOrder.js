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
}, {
	"name" : "Strategy",
	"tasks" : [{
		"taskTime" : 0,
		"taskName" : "Cash",
		"props" : "cash:200000",
		"blockName" : "Cash"
	}, {
		"taskTime" : 0,
		"taskName" : "Income",
		"props" : "wkIncome:1250",
		"blockName" : "Income"
	}]
}, {
	"name" : "House",
	"tasks" : []
}];