/*
	队列 类封装与实现
*/


function Queue() {
	this.dataStore = [];
}


/* 入队 */
Queue.prototype.enqueue = function(item) {
	this.dataStore.push(item);
	return this.dataStore;
}

/* 
	出队
 	@return 出队元素
*/
Queue.prototype.dequeue = function() {
	return this.dataStore.shift();
}

/* 读取队首元素 */
Queue.prototype.front = function() {
	return this.dataStore[0];
}

/* 读取队尾元素 */
Queue.prototype.back = function() {
	return this.dataStore[this.dataStore.length - 1];
}

/* 显示队列内所有元素 */
Queue.prototype.toString = function() {
	return this.data.dataStore.join(', ');
}

/* 判断队列是否为空 */
Queue.prototype.isEmpty = function() {
	return this.data.dataStore.length === 0;
}

/* 队列长度 */
Queue.prototype.getLength = function() {
	return this.dataStore.length;
}












