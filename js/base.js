/* global components */
var Base = {
    ajaxBase: function (url, type, async, data, callback) {
        data = data || {};

        $.ajax({
            url: url,
            type: type,
            data: data,
            cache: false,
            async: async,
            success: function (result) {
                callback && callback(result);
            },
            error: function (result) {
                var message = "",
                    httpStatus = result.status,
                    httpResponse = result.responseText;
                try {
                    httpResponse = JSON.parse(httpResponse);
                } catch (ex) {
                    httpResponse = {
                        message: httpResponse
                    };
                }

                if (httpStatus >= 400 && httpStatus < 500) {
                    if (httpStatus === 401) {
                        return location.href = 'login.html';
                    } else if (httpStatus === 403) {
                        message = httpResponse.message || '您没有操作权限';
                    } else if (httpStatus === 404) {
                        message = httpResponse.message || '请求的路由不存在';
                    } else {
                        message = httpResponse.message;
                    }
                } else if (httpStatus >= 500) {
                    message = httpResponse.message || '网络异常,请重试';
                } else {
                    message = httpResponse.message;
                }

                callback && callback({
                    "status": "error",
                    "message": message,
                    "httpStatus": httpStatus,
                    "httpResponse": httpResponse.message
                });
                return console.error(httpResponse);
            }
        });
    },

    ajaxGet: function (url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajaxBase(url, 'get', true, data, callback);
    },

    ajaxGetSync: function (url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajaxBase(url, 'get', false, data, callback);
    },

    ajaxPost: function (url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajaxBase(url, 'post', true, data, callback);
    },

    ajaxPostSync: function (url, data, callback) {
        if (typeof data === 'function') {
            callback = data;
            data = null;
        }
        this.ajaxBase(url, 'post', false, data, callback);
    }
};

// 自定义require方法
function require(name){
    var arr = name.split('/');
    
    // 加载自定义的组件
    if (arr[0] === 'components'){
        components[arr[1]]();
    }
}