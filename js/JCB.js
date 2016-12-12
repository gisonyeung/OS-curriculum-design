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

	return _need;
}

/* 申请资源 随机增加已分配资源 并进行银行家安全性判断 */
JCB.prototype.addAllocation = function() {
	
	var self = this;

	// 增量申请的资源数
	var _increase = {
		A: 0,
		B: 0,
		C: 0,
	};

	// Finish，表示系统是否有足够的资源分配给进程
	var _isEnough = true,
		notEnoughType = '',
		isSafe = false;

	_.map(['A','B','C'], function(type) {
		
		// 所需资源数未满
		if ( !self.isMax(type) ) {

			if (self.restTime === 1) { // 只剩最后一个时间片，则直接申请全部资源
				_increase[type] = self.need[type];
			} else {
				// 增量申请的资源 选用 随机增量值 与 当前JCB剩余所需资源 的 最小值。
				_increase[type] = Math.min(getRandomIntInRange(INCREASE_SRC_RANGE), self.need[type]);
			}

			// 系统剩余资源小于所需申请的资源，则修改 Finish。
			if ( restSRC[type] < _increase[type] ) {
				_isEnough = false;
				notEnoughType = type;
			}

		}
	});

	// 足够分配，则进行银行家算法，再决定是否分配
	if ( _isEnough ) {

		if ( bankerCheck(_increase) ) {

			isSafe = true;

			_.map(['A','B','C'], function(type) {
			
				// 所需资源数未满，进行资源分配
				if ( !self.isMax(type) ) {


					self.allocation[type] += _increase[type]; // JCB Allocation
					self.need[type] -= _increase[type]; // JCB Need
					restSRC[type] -= _increase[type]; // 修改系统剩余资源

				}
			});
		}
		

	}

	return {
		isEnough: _isEnough,
		type: notEnoughType,
		isSafe: isSafe,
	};

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

	var tag = {
		isEnough: true,
		type: '',
	};

	_.map(this.max, function(val, key) { 
		if (val > restSRC[key]) {
			tag.isEnough = false;
			tag.type = key;
		}

	});

	return tag;
}



/* 获取指定范围内的随机整数 */
function getRandomIntInRange(range) {
	// min ~ max
	return Math.round(range[0] + Math.random() * range[1]);
}



/* 
	银行家算法 
	实现思路：每次至少分配2份资源（当时间片为1时，直接分配所需资源）
*/
function bankerCheck(increase) {
	
	var _finish = false;
	var _work = _.cloneDeep(restSRC);

	_.map(readyQueue.dataStore, function(item, key) {
		if (key === 0) {

		}

		// 直接分配所需资源
		if (item.restTime === 1) {

		}

	})


	return true;
}