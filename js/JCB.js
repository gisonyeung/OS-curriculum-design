/*

	JCB 类的实现与封装

*/


/* 常量 */
var RUNTIME_RANGE = [1,20], // 预计运行时间范围
	A_SRC_RANGE = [0,5], // A 类资源范围
	B_SRC_RANGE = [0,3], // B 类资源范围
	C_SRC_RANGE = [0,4], // C 类资源范围
	INCREASE_SRC_RANGE = [1,2], // C 类资源范围
	A_SUM = 50,
	B_SUM = 30,
	C_SUM = 40;

var restSRC = {
	A: A_SUM,
	B: B_SUM,
	C: C_SUM,
};

var JCB_ids = 0; // JCB ID cache

function JCB() {
	this.id = this.getId(); // 作业标识
	this.max = this.getNeed(); // 最大资源需求
	this.planTime = this.getPlanTime(); // 预计运行时间
	this.restTime = this.planTime; // 剩余运行时间
	this.allocation = { // 已分配资源
		A: 0,
		B: 0,
		C: 0,
	};
	this.need = _.cloneDeep(this.max); // 现资源需求
}

/* 返回新任务ID */
JCB.prototype.getId = function() {
	return JCB_ids++;
}

/* 随机获取 预计运行时间 */
JCB.prototype.getPlanTime = function() {
	// Math.ceil() 向上取整，保证时间片足够分配资源
	var _maxSrc = _.max( _.map(this.max, function(val) { return val }) ); // 取三个类型资源的最大需求值
	return getRandomIntInRange([Math.ceil(_maxSrc / 2), RUNTIME_RANGE[1]]);
}

/* 随机获取 资源需求 */
JCB.prototype.getNeed = function() {
	
	var _need =  {
		A: getRandomIntInRange(A_SRC_RANGE),
		B: getRandomIntInRange(B_SRC_RANGE),
		C: getRandomIntInRange(C_SRC_RANGE),
	};

	// 修改系统剩余资源
	_.map(_need, function(value, key) {
		restSRC[key] = value;
	});

	return _need;
}

/* 申请资源 随机增加已分配资源 */
JCB.prototype.addAllocation = function(type) {
	
	// 所需资源数未满
	if ( !this.isMax(type) ) {

		// 增量申请的资源 选用 随机增量值 与 剩余所需资源 的 最小值。
		var _increaseNum = Math.min(getRandomIntInRange(INCREASE_SRC_RANGE), this.need[type]);

		this.allocation[type] += _increaseNum;
		this.need[type] -= _increaseNum;
		restSRC[type] -= _increaseNum; // 修改系统剩余资源

	}
}

/* 判断当前某类资源是否已经满足需求 */
JCB.prototype.isMax = function(type) {
	return this.allocation[type] === this.max[type];
}

/* 执行一个时间片 */
JCB.prototype.excute = function() {
	return this.restTime ? --this.restTime : this.restTime;
}

/* 获取系统剩余资源 */
JCB.prototype.getRestSRC = function() {
	return _.cloneDeep(restSRC);
}

/* 释放系统剩余资源 */
JCB.prototype.freeRestSRC = function() {
	_.map(this.allocation, function(val, key) {
		restSRC[key] += val;
	});
	return _.cloneDeep(restSRC);
}

/* 判断当前作业资源需求是否小于或等于系统剩余资源 */
JCB.prototype.isEnough = function() {

	return !( ~_.indexOf( _.map(this.max, function(val, key) { return val <= restSRC[key]; }), 
							false) );
}



/* 获取指定范围内的随机整数 */
function getRandomIntInRange(range) {
	// min ~ max
	return Math.round(range[0] + Math.random() * range[1]);
}