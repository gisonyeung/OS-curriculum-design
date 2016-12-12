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

		// 执行总次数增加
		system_vm.times++;

		// 申请新的资源（已满则不会增加资源数）
		front_JCB.addAllocation('A');
		front_JCB.addAllocation('B');
		front_JCB.addAllocation('C');

		// 减少时间片
		if ( front_JCB.excute() ) { // 尚未执行完毕，重新入队
			readyQueue.enqueue(front_JCB);
		} else { // 执行完毕，当前 JCB 加入已完成队列，并从后备队列调入一个 JCB 进就绪队列

			// 释放系统资源
			front_JCB.freeRestSRC();
			doneQueue.enqueue(front_JCB);

			if ( backQueue.getLength() ) { // 后备队列还有任务则调入任务进就绪队列

				var new_JCB = backQueue.dequeue();

				// if ( new_JCB.isEnough() ) {
					readyQueue.enqueue( new_JCB );
				// } else {
					// append to next blockqueue
				// }
			}
		}
	}











	


// });

