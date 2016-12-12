// $(function() {

	var JOB_SUM = 100; // 系统运行作业总数
		
	var backQueue = new Queue(), // 初始化 后备队列
		readyQueue = new Queue(), // 初始化 就绪队列
		blockQueue_A = new Queue(), // 初始化 阻塞队列 A
		blockQueue_B = new Queue(), // 初始化 阻塞队列 B
		blockQueue_C = new Queue(), // 初始化 阻塞队列 C
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

	var system_vm = new Vue({
		el: '#system',
		data: {
			items: readyQueue.dataStore,
			times: 0,
			allTimes: 0,
		},
		methods: {
			getCount: function(type) {
				return _.sum(_.map(this.items, function(obj) {
					return obj.allocation[type];
				}));
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
			refresh: function() {
				window.location.reload();
			},

		},
	});

	var blockQueue_A_vm = new Vue({
		el: '#block-queue-A',
		data: {
			items: blockQueue_A.dataStore,
		}
	});

	var blockQueue_B_vm = new Vue({
		el: '#block-queue-B',
		data: {
			items: blockQueue_B.dataStore,
		}
	});

	var blockQueue_C_vm = new Vue({
		el: '#block-queue-C',
		data: {
			items: blockQueue_C.dataStore,
		}
	});



	var doneQueue_vm = new Vue({
		el: '#done-queue',
		data: {
			items: doneQueue.dataStore,
		}
	});



	// 将系统全部作业加进后备队列中
	repeat(JOB_SUM, function() {
		backQueue.enqueue( new JCB() );
	});

	var allTimes = 0;

	// 统计总时间片
	_.map(backQueue.dataStore, function(o) {
		allTimes += o.planTime;
	});

	system_vm.allTimes = allTimes;


	// 将作业从后备队列中调入 10 个作业进入系统
	repeat(10, function() {
		readyQueue.enqueue( backQueue.dequeue() );
	});


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

		// @return { isEnough: Boolean, type: String, isSafe: Boolean } 
		// isEnough 是否足够资源，足够时运行银行家算法
		// type 不足资源时，哪类资源首先不足
		// isSafe 足够资源时，银行家安全性算法，检查是否安全
		var _status = front_JCB.addAllocation();

		// 申请新的资源，新增成功返回 true，资源不足返回 fals（已满则不会增加资源数，并直接返回 true）
		if ( _status.isEnough ) { // 资源足够，分配资源成功

			
			if ( _status.isSafe ) { // 安全，执行时间片后入队

				system_vm.times++; // 执行总次数增加

				/* excute() 方法用以模拟进程执行，对应进程剩余时间片减1 */
				if ( front_JCB.excute() ) { // 尚未执行完毕

					readyQueue.enqueue(front_JCB); // 重新入队

				} else { // 执行完毕

					// 释放系统资源
					front_JCB.freeRestSRC();
					doneQueue.enqueue(front_JCB); // 当前 JCB 加入已完成队列

					if ( backQueue.getLength() ) { // 后备队列还有任务则调入任务进就绪队列
						var new_JCB = backQueue.dequeue(); // 从后备队列出队一个 JCB
						readyQueue.enqueue( new_JCB ); // 从后备队列调入一个 JCB 进就绪队列
					}
				}
				
			} else { // 不安全，直接重新入队：就绪队列
				readyQueue.enqueue(front_JCB); // 重新入队
			}

		} else { // 资源不足，进入阻塞队列
			console.log('资源不足，进入阻塞队列：' + _status.type);
			switch(_status.type) {
				case 'A': 
					blockQueue_A.enqueue(front_JCB);
					break;
				case 'B': 
					blockQueue_B.enqueue(front_JCB);
					break;
				case 'C': 
					blockQueue_C.enqueue(front_JCB);
					break;
			}
		}

	}











	


// });

