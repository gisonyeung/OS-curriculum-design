/*

	@author 3114006311杨子聪 https://github.com/gisonyeung/OS-curriculum-design

*/


var JOB_SUM = 100; // 系统运行作业总数
	
var backQueue = new Queue(), // 初始化 后备队列
	readyQueue = new Queue(), // 初始化 就绪队列
	blockQueue = {
		A: new Queue(), // 初始化 阻塞队列 A
		B: new Queue(), // 初始化 阻塞队列 B
		C: new Queue(), // 初始化 阻塞队列 C
	},
	doneQueue = new Queue(); // 初始化 已完成队列

var backQueue_vm = new Vue({
	el: '#back-queue',
	data: {
		items: backQueue.dataStore,
		isHide: true,
	},
	methods: {
		togglePanel: function() {
			this.isHide = !this.isHide;
		}
	}
});

var readyQueue_vm = new Vue({
	el: '#ready-queue',
	data: {
		items: readyQueue.dataStore,
	},
});

var init_vm = new Vue({
	el: '#init',
	data: {
		sum: JOB_SUM,
		src: _.cloneDeep(restSRC),
	},
	methods: {
		refresh: function() {

			if ( this.sum < 0 ) {
				system_vm.echo('系统初始化：请输入一个合理的系统任务数');
			} else if ( this.src.A < 5 ) {
				system_vm.echo('系统初始化：请输入合理的 A 类资源总量，不能小与 5');
			} else if ( this.src.B < 3 ) {
				system_vm.echo('系统初始化：请输入合理的 B 类资源总量，不能小与 3');
			} else if ( this.src.C < 4 ) {
				system_vm.echo('系统初始化：请输入合理的 C 类资源总量，不能小与 4');
			} else {
				runSystem(this.sum, this.src);
			}

		},
	},
	watch: {

	}
});

var system_vm = new Vue({
	el: '#system',
	data: {
		src: _.cloneDeep(restSRC),
		rest: restSRC,
		times: 0,
		allTimes: 0,
		systemMessage: [],
	},
	methods: {
		getCount: function(type) {
			return this.src[type] - this.rest[type];
		},
		next: function() {
			nextStep(1);
		},
		next10: function() {
			repeat(10, nextStep);
		},
		next100: function() {
			repeat(100, nextStep);
		},
		echo: function(msg) {
			this.systemMessage.push(msg);
		},
		emptyMsg: function() {
			this.systemMessage = [];
		},
	},
	watch: {
		times: function(newTimes) {
			if ( newTimes === this.allTimes ) {
				this.echo('系统全部任务运行完毕，总执行时间片：' + this.allTimes);
			}
		},
		systemMessage: function() { // 信息框滚动条置底
			this.$nextTick(function() {
		    	var list = document.getElementById('console');
		    	list.scrollTop = list.scrollHeight;
		    });
		}
	}
});



var blockQueue_A_vm = new Vue({
	el: '#block-queue-A',
	data: {
		items: blockQueue['A'].dataStore,
	}
});

var blockQueue_B_vm = new Vue({
	el: '#block-queue-B',
	data: {
		items: blockQueue['B'].dataStore,
	}
});

var blockQueue_C_vm = new Vue({
	el: '#block-queue-C',
	data: {
		items: blockQueue['C'].dataStore,
	}
});

var doneQueue_vm = new Vue({
	el: '#done-queue',
	data: {
		items: doneQueue.dataStore,
	}
});


runSystem(JOB_SUM, system_vm.src);

/*
	运行系统
	@param { Object } 系统资源总数
*/
function runSystem(jobSum, systemSrc){
	// 修改总数
	_.forEach(system_vm.src, function(val, type) {
		system_vm.src[type] = systemSrc[type];
		restSRC[type] = systemSrc[type];
	});

	// 清空 6 个队列
	backQueue.empty();
	readyQueue.empty();
	blockQueue['A'].empty();
	blockQueue['B'].empty();
	blockQueue['C'].empty();
	doneQueue.empty();

	// JCB 标识归零
	JCB_ids = 0;

	// 清空控制台信息
	system_vm.emptyMsg();

	// 将系统全部作业加进后备队列中
	repeat(jobSum, function() {
		backQueue.enqueue( new JCB() );
	});

	var allTimes = 0;

	// 统计总时间片
	_.forEach(backQueue.dataStore, function(o) {
		allTimes += o.planTime;
	});

	system_vm.allTimes = allTimes;

	// 将作业从后备队列中调入 10 个作业进入系统
	repeat(10, function() {
		readyQueue.enqueue( backQueue.dequeue() );
	});

}


// 用于顺序获取阻塞队列下一次的类型值。柯里化
var nextBlockQueue = (function() {
	var _current = 0;

	return {
		current: function() {
			return String.fromCharCode(_current + 65);
		},
		next: function() {
			_current = ++_current % 3
			return String.fromCharCode(_current + 65);
		},
		reset: function() {
			_current = 0;
			return String.fromCharCode(_current + 65);
		}
	}
})();


/*
	模拟：循环执行就绪队列中的任务
	跳出循环条件：就绪队列长度为 0 && 后备队列长度为 0
*/
function nextStep() {
	var front_JCB = readyQueue.dequeue();

	if ( !front_JCB ) {
		return false;
	}

	/* 进入运行过程 */

	/*
		@return { isEnough: Boolean, isSafe: Boolean, isMax: Boolean} 
		isEnough 是否足够资源，足够时运行银行家算法
		isSafe 足够资源时，银行家安全性算法，检查是否安全
		isMax 是否早已满足资源需求
	*/
	var _status = front_JCB.addAllocation();

	
	if ( _status.isEnough ) { // 资源足够，分配资源成功
		_status.isMax ? // 早已满足资源需求，直接执行，调过进行银行家检查
			system_vm.echo('进程[JCB - ' + front_JCB.id + ']所需资源已满，不需再进行分配，跳过银行家检查')
			:
			system_vm.echo('进程[JCB - ' + front_JCB.id + ']所需资源足够，准备进行银行家算法安全性检查');

		if ( _status.isSafe ) { // 安全，执行时间片后入队
			!_status.isMax && system_vm.echo('安全性检查通过，准备对进程[JCB - ' + front_JCB.id + ']进行资源分配并执行1个时间片')
			/* excute() 方法用以模拟进程执行，对应进程剩余时间片减1 */
			if ( front_JCB.excute() ) { // 尚未执行完毕

				readyQueue.enqueue(front_JCB); // 重新入队

			} else { // 执行完毕，释放系统资源，唤醒阻塞队列中全部任务

				// 释放系统资源
				front_JCB.freeRestSRC();
				doneQueue.enqueue(front_JCB); // 当前 JCB 加入已完成队列

				system_vm.echo('进程[JCB - ' + front_JCB.id + ']完成，进入完成队列');
				_.forEach(front_JCB.allocation, function(val, type) {
					system_vm.echo('释放 ' + type + ' 类资源：' + val);
				});

				nextBlockQueue.reset();

				var isBlockQueueStillHasJob = true; // 用于清空阻塞队列中的任务

				var _blockQueueJCB;
				while ( isBlockQueueStillHasJob ) { // 阻塞队列有任务
					
					isBlockQueueStillHasJob = false;

					// 有任务则顺序取出任务
					if ( blockQueue[nextBlockQueue.current()].getLength() ) { // 有任务
						 // 从当前阻塞调入一个 JCB 进就绪队列
						_blockQueueJCB = blockQueue[nextBlockQueue.current()].dequeue();
						readyQueue.enqueue( _blockQueueJCB );

						system_vm.echo('唤醒阻塞队列[' + nextBlockQueue.current() +']中的进程[JCB - ' + _blockQueueJCB.id + ']');
					}

					// 判断阻塞队列是否还有任务
					_.forEach(blockQueue, function(queue, type) {
						if ( queue.getLength() ) {
							isBlockQueueStillHasJob = true;
						}
					});

					// 指针转向下一个阻塞队列
					nextBlockQueue.next();
					
				}

				// 释放资源
				_blockQueueJCB = null;



				// 重设指针，确保进入阻塞队列时能从 A 开始
				nextBlockQueue.reset();

				// 后备队列还有任务 则从后备队列调任务进就绪队列
				if ( backQueue.getLength() ) {
					var new_JCB = backQueue.dequeue();
					readyQueue.enqueue( new_JCB ); // 从后备队列调入一个 JCB 进就绪队列
					system_vm.echo('进程[JCB - ' + new_JCB.id + ']从后备队列进入就绪队列')
				}
			}

			system_vm.times++; // 执行总次数增加

		} else { // 不安全，直接重新入队：就绪队列
			system_vm.echo('安全性检查不通过，进程[JCB - ' + front_JCB.id + ']直接进入就绪队列队尾');
			readyQueue.enqueue(front_JCB); // 重新入队
		}

	} else { // 资源不足，按顺序进入阻塞队列
			 // 资源释放时，按顺序出队
		system_vm.echo('资源不足，将进程[JCB - ' + front_JCB.id + ']调入阻塞队列[' + nextBlockQueue.current() + ']');
		blockQueue[nextBlockQueue.current()].enqueue(front_JCB);

		nextBlockQueue.next()

	}

}

