// ==UserScript==
// @name        posfie-hide-user
// @namespace   recyclebin5385
// @description posfieの特定ユーザを見えなくする
// @match     http://posfie.com/*
// @match     https://posfie.com/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @version     8
// @grant       none
// ==/UserScript==

// Copyright (c) 2016, recyclebin5385
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
// * Neither the name of the <organization> nor the names of its contributors
//   may be used to endorse or promote products derived from this software
//   without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

//
// 説明
// ----
//
// posfieのまとめのうち、特定のユーザが作成したものをまとめて非表示にします。
//
// 非表示にするには、プロフィール画像アイコンをダブルクリックします。
// 削除済みのまとめをダブルクリックすると再表示します。
// 注意: デフォルトの卵アイコンには効果がありません。
//
//
// 連絡先
// ------
// recyclebin5385[at]yahoo.co.jp ([at]を@に置換してください)
//

(function() {
    jQuery.noConflict();
    var $ = jQuery;

    var urlToIdPattern = /\/(?:default_)?profile_images\/([^\/]+)/;

    function urlToId(url) {
        if(url.match(urlToIdPattern)) {
            return RegExp.$1;
        } else {
            return null;
        }
    }

    function getCookieMap() {
        var ret = new Array();

        var allCookies = document.cookie;
        if( allCookies != '' ) {
            var cookies = allCookies.split('; ');
            for( var i = 0; i < cookies.length; i++ ) {
                var cookie = cookies[i].split('=');

                // クッキーの名前をキーとして 配列に追加する
                ret[cookie[0]] = decodeURIComponent(cookie[1]);
            }
        }

        return ret;
    }

    function getHiddenUserIds() {
        var joinedHiddenUserIds = null;
        if (typeof localStorage !== 'undefined') {
            // localStorageから取得
            joinedHiddenUserIds = localStorage.getItem('posfie-hide-user.hiddenUserIds');
        }
        if (!joinedHiddenUserIds) {
            // Cookieから取得
            var cookieMap = getCookieMap();
            joinedHiddenUserIds = cookieMap['hiddenUserIds'];
        }
        if (joinedHiddenUserIds) {
            return joinedHiddenUserIds.split(' ');
        } else {
            return new Array();
        }
    }

    function setHiddenUserIds(ids) {
        if (typeof localStorage !== 'undefined') {
            // localStorageに保存
            localStorage.setItem('posfie-hide-user.hiddenUserIds', ids.join(' '));
        } else {
            // Cookieに保存
            var now = new Date();
            var maxAgeDay = 30;
            now.setTime(now.getTime() + maxAgeDay * 24 * 60 * 60 * 1000);
            var expires = now.toGMTString();
            var cookie = 'hiddenUserIds=' + encodeURIComponent(ids.join(' ')) + ";expires=" + expires;

            if (cookie.length > 4096) {
                return false;
            }

            document.cookie = cookie;
        }
        hideUsers();
        return true;
    }

    function addHiddenUserId(id) {
        var ids = getHiddenUserIds();
        if ($.inArray(id, ids) == -1) {
            ids.push(id);
        }

        if (!setHiddenUserIds(ids)) {
            var deleted = 0;
            while (ids.length > 0) {
                ids.shift();
                deleted++;
                if (setHiddenUserIds(ids)) {
                    alert("容量オーバーのため古いIDを" + deleted + "件削除しました。");
                    return;
                }
            }
        }
    }

    function removeHiddenUserId(id) {
        var ids = getHiddenUserIds();
        var newIds = [];
        for (var i = 0; i < ids.length; i++) {
            if (id != ids[i]) {
                newIds.push(ids[i]);
            }
        }
        setHiddenUserIds(newIds);
    }

    function hideUsers() {
        var hiddenUserIds = getHiddenUserIds();
//        $('.topics_box .icon_24').each(function() {
        //posfie で変更
        $('.user_show_posts_box .icon_30').each(function() {
            var id = urlToId($(this).attr('data-lazy-src') || $(this).attr('data-s') || $(this).attr('src'));
            var parentLi = $(this).parents('section').filter(':not(.dummy)');
            //listがsectionに変わった
            var dummyParentLi = $(this).parents('section').next('section.dummy');

            if (id == null || id == '') {
                console.error("id is null at hideUsers",id);
                //UIが変わって urlToId が動かないときこのエラーがでてほしい
            }

            if ($.inArray(id, hiddenUserIds) != -1) {
                parentLi.hide();
                if (dummyParentLi.length == 0) {
                    parentLi.after("<section class='clearfix dummy'></section>");
                    dummyParentLi = parentLi.next('.dummy');

                    // 削除済のまとめに対してユーザのアイコンを出す場合は以下をアンコメントする
                     dummyParentLi.append($(this).clone(true).unbind('dblclick'));
                    dummyParentLi.attr('title', parentLi.find('h3').text());
                    dummyParentLi.append("[削除済]");
                    dummyParentLi.dblclick(function() {
                        if (confirm("このユーザを見えるようにしますか？")) {
                            removeHiddenUserId(id);
                        }
                    });
                };

                dummyParentLi.show();
            } else {
                parentLi.show();
                dummyParentLi.hide();
            }
        });
    }

    $(function() {
//        $('.topics_box .icon_24').dblclick(function() {
        //posfie で変更
        $('.user_show_posts_box .user_icon').click(function() { return false; });
        $('.user_show_posts_box .icon_30').dblclick(function() {
            var id = urlToId($(this).attr('data-lazy-src') || $(this).attr('data-s') || $(this).attr('src'));
//            var idURL = $(this).attr('data-lazy-src') || $(this).attr('data-s') || $(this).attr('src');
//            var id = urlToId(idURL);

            if (id == null || id == '') {
console.error("id is null at dblClick",id);
                //UIが変わって urlToId が動かないときこのエラーがでてほしい
                return;
            }

            var hiddenUserIds = getHiddenUserIds();
            if ($.inArray(id, hiddenUserIds) == -1) {
//console.error("NOT hide",id );
                if (confirm("このユーザを見えなくしますか？")) {
                    addHiddenUserId(id);
                }
            } else {
//console.error("HIDEed", id);
                if (confirm("このユーザを見えるようにしますか？")) {
                    removeHiddenUserId(id);
                }
            }
        });

        hideUsers();
    });
})();