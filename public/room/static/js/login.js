"use strict"

function initLogin() {
    console.log("加载登录组件")
    let switchLogBtn = document.querySelector(".center-box.reg button.reg");
    let switchRegBtn = document.querySelector(".center-box.log button.reg");
    let loginBtn = document.querySelector(".center-box.log button.log");
    let regBtn = document.querySelector(".center-box.reg button.log");

    let logNameInput = document.querySelector(".center-box.log input.log-name");
    let logPswInput = document.querySelector(".center-box.log input.log-psw");

    let regNameInput = document.querySelector(".center-box.reg input.reg-name");
    let regPswInput = document.querySelector(".center-box.reg input.reg-psw");
    let regKeyInput = document.querySelector(".center-box.reg input.reg-key");

    let allInput = document.querySelectorAll(".center-box input");

    // 切换界面
    switchRegBtn.addEventListener("click", function() {
        document.querySelector(".login-view.show").className = "login-view show reg";
    });
    switchLogBtn.addEventListener("click", function() {
        document.querySelector(".login-view.show").className = "login-view show log";
    });

    // 监听输入框
    allInput.forEach((el, index) => {
        onRangeChange(el, function() {
            getNextEl(el).className = "text-info"
        })
    })

    // input监听方法
    function onRangeChange(r, f) {
        let n, c, m;
        r.addEventListener("input", function(e) {
            n = 1;
            c = e.target.value;
            if (c != m) f(e);
            m = c;
        });
        r.addEventListener("change", function(e) { if (!n) f(e); });
    }


    function loginSuccess() {
        let className = "reg"
        if (document.querySelector(".login-view").className.includes(" log ")) {
            className = "log"
        }
        setTimeout(function() {
            document.querySelector(".login-view").className = `login-view show ${className} login-success`
            loginSuccessReturn()
        }, 500)
    }

    // cookie登录
    if (Cookies.get("user")) {
        console.log("尝试cookie登录")
        axios.post('/loginCookie')
            .then(function(response) {
                if (response.data.status) {
                    console.log("cookie验证成功")
                    loginSuccess()
                } else {
                    // Cookies.remove("user")
                    setTimeout(function() {
                        document.querySelector(".login-view").className += " show"
                    }, 300)
                }
            })
            .catch(function(error) {
                Cookies.remove("user")
                setTimeout(function() {
                    document.querySelector(".login-view").className += " show"
                }, 300)
            })
    } else {
        console.log("没有cookie,需要登录后访问")
        setTimeout(function() {
            document.querySelector(".login-view").className += " show"
        }, 300)
    }

    // 登录请求
    let loginIn = false
    loginBtn.addEventListener("click", function() {
        let nameEl = document.querySelector(".log-name");
        let pswEl = document.querySelector(".log-psw");
        if (nameEl.value.length !== 0) {
            if (nameEl.value.length >= 4 && nameEl.value.length <= 12 && /^[0-9a-zA-Z]*$/.test(nameEl.value)) {
                if (pswEl.value.length !== 0) {
                    if (pswEl.value.length >= 6 && pswEl.value.length <= 18) {
                        // 完成本地验证
                        if (!loginIn) {
                            console.log("登录", nameEl.value, pswEl.value);
                            loginIn = true
                            axios.post('/login', {
                                    name: nameEl.value,
                                    password: pswEl.value
                                })
                                .then(function(response) {
                                    console.log(response);
                                    if (response.data.status) {
                                        loginBtn.innerText = "登录成功";
                                        loginSuccess()
                                    } else {
                                        setTimeout(function() {
                                            loginIn = false
                                            loginBtn.innerText = "登录";
                                        }, 1000)
                                        loginBtn.className = "log";
                                        if (response.data.code === 1) {
                                            loginBtn.innerText = "账号或密码错误";
                                        } else if (response.data.code === 0) {
                                            loginBtn.innerText = "填写信息有误";
                                        } else {
                                            loginBtn.innerText = "未知错误";
                                        }
                                        switchRegBtn.className = "reg ";
                                        nameEl.className = "log-name ";
                                        pswEl.className = "log-psw ";
                                    }
                                })
                                .catch(function(error) {
                                    setTimeout(function() {
                                        loginIn = false
                                        loginBtn.innerText = "登录";
                                    }, 1000)
                                    console.log(error);
                                    loginBtn.className = "log";
                                    loginBtn.innerText = "请重试";
                                    switchRegBtn.className = "reg ";
                                    nameEl.className = "log-name ";
                                    pswEl.className = "log-psw ";
                                });
                            // 禁用页面功能直到返回信息
                            loginBtn.className = "log loding-status";
                            loginBtn.innerText = "登录中";
                            switchRegBtn.className = "reg disable";
                            nameEl.className = "log-name disable";
                            pswEl.className = "log-psw disable";
                        }
                    } else {
                        let infoText = getNextEl(pswEl)
                        infoText.innerText = "密码长度应在6-18位"
                        infoText.className = "text-info show war"
                    }
                } else {
                    let infoText = getNextEl(pswEl)
                    infoText.innerText = "请输入密码"
                    infoText.className = "text-info show war"
                }
            } else {
                let infoText = getNextEl(nameEl)
                infoText.innerText = "用户名长度应在4-12位,且只能包含数字和字母"
                infoText.className = "text-info show war"
            }
        } else {
            let infoText = getNextEl(nameEl)
            infoText.innerText = "请输入用户名"
            infoText.className = "text-info show war"
        }
    });
    // 注册请求
    let leve = 0
    regBtn.addEventListener("click", function() {
        let nameEl = document.querySelector(".reg-name");
        let pswEl = document.querySelector(".reg-psw");
        let keyEl = document.querySelector(".reg-key");
        if (nameEl.value.length !== 0) {
            if (nameEl.value.length >= 4 && nameEl.value.length <= 12 && /^[0-9a-zA-Z]*$/.test(nameEl.value)) {
                if (pswEl.value.length !== 0) {
                    if (pswEl.value.length >= 6 && pswEl.value.length <= 18) {
                        if (leve >= 2) {
                            if (keyEl.value.length !== 0) {
                                if (keyEl.value.length === 12) {
                                    if (!loginIn) {
                                        console.log("注册");
                                        // 完成本地验证
                                        loginIn = true
                                        axios.post('/registered', {
                                                name: nameEl.value,
                                                password: pswEl.value,
                                                invitationCode: keyEl.value
                                            })
                                            .then(function(response) {
                                                console.log(response)
                                                if (response.data.status) {
                                                    console.log("注册成功")
                                                    regBtn.innerText = "注册成功";
                                                    loginSuccess()
                                                } else {
                                                    setTimeout(function() {
                                                        loginIn = false
                                                        regBtn.innerText = "注册";
                                                    }, 1000)
                                                    if (response.data.code === 1) {
                                                        regBtn.innerText = "用户名已被使用";
                                                    } else if (response.data.code === 0) {
                                                        regBtn.innerText = "填写信息有误";
                                                    } else {
                                                        regBtn.innerText = "未知错误";
                                                    }
                                                    regBtn.className = "log";
                                                    switchLogBtn.className = "reg"
                                                    nameEl.className = "reg-name"
                                                    pswEl.className = "reg-psw"
                                                    keyEl.className = "reg-key"
                                                }
                                            })
                                            .catch(function(error) {
                                                setTimeout(function() {
                                                    loginIn = false
                                                    regBtn.innerText = "注册";
                                                }, 1000)
                                                regBtn.innerText = "请重试";
                                                regBtn.className = "log";
                                                switchLogBtn.className = "reg"
                                                nameEl.className = "reg-name"
                                                pswEl.className = "reg-psw"
                                                keyEl.className = "reg-key"
                                            })
                                        regBtn.className = "log loding-status";
                                        regBtn.innerText = "注册中";
                                        switchLogBtn.className = "reg disable"
                                        nameEl.className = "log-name disable"
                                        pswEl.className = "log-psw disable"
                                        keyEl.className = "reg-key disable"
                                    }

                                } else {
                                    let infoText = getNextEl(keyEl)
                                    infoText.innerText = "邀请码有误"
                                    infoText.className = "text-info show war"
                                }
                            } else {
                                let infoText = getNextEl(keyEl)
                                infoText.innerText = "请输入邀请码"
                                infoText.className = "text-info show war"
                            }
                        }
                    } else {
                        let infoText = getNextEl(pswEl)
                        infoText.innerText = "密码长度应在6-18位"
                        infoText.className = "text-info show war"
                    }
                } else {
                    let infoText = getNextEl(pswEl)
                    infoText.innerText = "请输入密码"
                    infoText.className = "text-info show war"
                }
            } else {
                let infoText = getNextEl(nameEl)
                infoText.innerText = "用户名长度应在4-12位,且只能包含数字和字母"
                infoText.className = "text-info show war"
            }
        } else {
            let infoText = getNextEl(nameEl)
            infoText.innerText = "请输入用户名"
            infoText.className = "text-info show war"
        }
    });
    // 密码验证
    onRangeChange(document.querySelector(".reg-psw"), function() {
        leve = 0
        let pswEl = document.querySelector(".reg-psw");
        let infoText = getNextEl(pswEl)
        if (/\d/.test(pswEl.value)) { leve++ }
        if (/[a-z]/.test(pswEl.value)) { leve++ }
        if (/[A-Z]/.test(pswEl.value)) { leve++ }
        if (/\W/.test(pswEl.value)) { leve++ }
        if (/\s/.test(pswEl.value)) {
            leve = 0
            infoText.innerText = "不能含有空格"
            infoText.className = "text-info show war"
        }
        switch (leve) {
            case 1:
                infoText.innerText = "太简单啦,试试混合多种字符"
                infoText.className = "text-info show war"
                break;
            case 2:
                infoText.innerText = "勉勉强强"
                infoText.className = "text-info show info"
                break;
            case 3:
                infoText.innerText = "还不错"
                infoText.className = "text-info show success"
                break;
            case 4:
                infoText.innerText = "完美的密码"
                infoText.className = "text-info show success"
                break;
        }
        if (pswEl.value.length >= 6) {
            if (pswEl.value.length <= 18) {

            } else {
                infoText.innerText = "密码最多18位"
                infoText.className = "text-info show war"
            }
        } else {
            infoText.innerText = "密码至少6位"
            infoText.className = "text-info show war"
        }
        console.log(leve)
    })

    // 获取下一个元素 - 传入元素
    function getNextEl(el) {
        let listNode = el.parentNode.childNodes
        let newList = []
        for (var i = 0; i < listNode.length; i++) {
            if (listNode[i].nodeName !== "#text") {
                newList.push(listNode[i]);
            }
        }
        for (var i = 0; i < newList.length; i++) {
            if (newList[i] === el) {
                return newList[i + 1]
            }
        }
        return null
    }

    // 获取上一个元素 - 传入元素
    function getPrevEl(el) {
        let listNode = el.parentNode.childNodes
        let newList = []
        for (var i = 0; i < listNode.length; i++) {
            if (listNode[i].nodeName !== "#text") {
                newList.push(listNode[i]);
            }
        }
        for (var i = 0; i < newList.length; i++) {
            if (newList[i] === el) {
                return newList[i - 1]
            }
        }
        return null
    }
}