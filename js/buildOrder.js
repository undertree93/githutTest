var buildOrder = 
[{
	"name" : "Environment",
	"tasks" : [{
		"taskTime" : 0,
		"taskName" : "OneTime",
		"props" : "cash:880000,housingMarketIncrease:5,cashMarketIncrease:8",
		"blockName" : "OneTime"
	},{
		"taskTime" : 0,
		"taskName" : "Routine",
		"props" : "wkSalary:2000,wkCost:1250",
		"blockName" : "Routine"
	}]
},  {
	"name" : "House",
	"tasks" : [{
		"taskTime" : 0,
		"taskName" : "BuyHouse",
		"props" : "TtlVal:1000000,Loan:570000,yrInterest:3.15,wkPay:750",
		"blockName" : "BuyHouse"
	}]
},  {
	"name" : "House",
	"tasks" : [{
		"taskTime" : 0,
		"taskName" : "BuyHouse",
		"props" : "TtlVal:1000000,Loan:700000,yrInterest:5,wkPay:750",
		"blockName" : "BuyHouse"
	},{
		"taskTime" : 20,
		"taskName" : "RentHouse",
		"props" : "wkIncome:1200,wkCost:200",
		"blockName" : "RentHouse"
	}]
}];