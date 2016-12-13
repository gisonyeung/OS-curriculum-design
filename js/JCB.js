/*

	JCB 类的实现与封装
	@author 3114006311杨子聪 https://github.com/gisonyeung/OS-curriculum-design

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
		// notEnoughType = '',
		isSafe = false,
		isMax = true;

	_.map(['A','B','C'], function(type) {
		
		// 所需资源数未满
		if ( !self.isMax(type) ) {
			isMax = false;
			if (self.restTime === 1) { // 只剩最后一个时间片，则直接申请全部资源
				_increase[type] = self.need[type];
			} else {
				// 增量申请的资源 选用 （随机增量值 与 当前JCB剩余所需资源 与 系统总资源的二分之一） 的最小值。
				_increase[type] = Math.min(
					getRandomIntInRange(INCREASE_SRC_RANGE), 
					self.need[type], 
					Math.floor(system_vm.src[type] / 2) // 题目要求：每个进程申请各类资源的数目不能超过系统资源总数的二分之一
				);
			}

			// 系统剩余资源小于所需申请的资源，则修改 Finish。
			if ( restSRC[type] < _increase[type] ) {
				_isEnough = false;
				// notEnoughType = type;
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
		// type: notEnoughType,
		isSafe: isSafe,
		isMax: isMax,
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
	_.forEach(this.allocation, function(val, key) {
		restSRC[key] += val;
	});
	return _.cloneDeep(this.allocation);
}

/* 判断当前作业资源需求是否小于或等于系统剩余资源 */
JCB.prototype.isEnough = function() {

	var tag = {
		isEnough: true,
		type: '',
	};

	_.forEach(this.max, function(val, key) { 
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
	实现思路：每次分配 min(2,need) 份资源（当时间片为1时，直接分配所需资源）
*/
function bankerCheck(increase) {
	
	var _isSafe = true, // 安全性检查结果标记值
		_isFinish = false; // 迭代判断是否结束标记值

	// 拷贝系统剩余资源副本
	var _work = _.cloneDeep(restSRC);

	// 拷贝就绪队列中除去目标进程的其他九个进程的副本 
	var _copyQueue = _.slice(_.cloneDeep(readyQueue.dataStore), 1);

	// 假设已经给目标进程分配资源
	_.forEach(_work, function(val, type) {
		_work[type] -= increase[type];
	});

	while ( !_isFinish ) {
		_isFinish = true;
		
		_.forEach(_copyQueue, function(item) {

			// 模拟分配资源，判断系统资源是否足够
			var _isEnough = true;

			// 时间片大于1，分配 min(2,need) 份资源
			if (item.restTime > 1) {

				// 分配的新资源数
				var new_allocation = {
					A: 0,
					B: 0,
					C: 0,
				};

				// 判断资源是否足够
				_.forEach(item.need, function(val, type) {
					if ( Math.min(val, 2) > _work[type] ) {
						_isEnough = false;
					} else {
						// 分配 min(2,need) 份资源
						new_allocation[type] = Math.min(val, 2);
					}
				});

				// 资源足够，则尝试分配资源，并判断是否能够直接满足剩余所需全部资源顺利执行
				if ( _isEnough ) {

					// 判断此次分配资源是否能直接满足剩余所需资源
					var _isFull = true;

					// 尝试分配资源
					_.forEach(item.allocation, function(val, type) {

						_work[type] -= new_allocation[type]; // 减少系统剩余资源
						item.need[type] -= new_allocation[type]; // 减少进程资源需求数
						item.allocation[type] += new_allocation[type]; // 增加已分配数

						// 尚不能填满
						if ( item.need[type] !== 0 ) {
							_isFull = false;
						}
					});

					// 能填满资源，则直接释放资源，并将状态改为执行完毕
					if ( _isFull ) {
						// 释放资源
						_.forEach(item.allocation, function(val, type) {
							_work[type] += item.allocation[type];
							item.allocation[type] = 0;
						});
						// 执行完毕（修改剩余时间片）
						item.restTime = 0;
					} else { // 不能填满资源，则减少一个时间片，并不释放资源
						item.restTime--;
						_isFinish = false; // 修改外部循环标记值，false 说明安全性算法还未结束，需要再次进行循环
					}
				
				} else { // 资源不足够，则不可以顺利执行，此时可以判定安全性算法不通过，终止循环
					return (_isSafe = false);
				}

			} else if (item.restTime === 1) { // 时间片剩最后一个，直接分配所需资源

				_.forEach(item.need, function(val, type) {
					if ( val > _work[type] ) {
						_isEnough = false;
					}
				});

				// 资源足够，则一定可以顺利执行，此时直接释放已占有的资源即可
				if ( _isEnough ) {

					// 释放资源
					_.forEach(item.allocation, function(val, type) {
						_work[type] += item.allocation[type];
						item.allocation[type] = 0;
					});

					// 执行完毕（修改剩余时间片）
					item.restTime = 0;
				
				} else { // 资源不足够，则不可以顺利执行，此时可以判定安全性算法不通过，终止循环
					return (_isSafe = false);
				}
			} else if (item.restTime === 0) { // 时间片为 0，说明已执行完毕
				// continue;
			}

		});

	}

	return _isSafe;
}