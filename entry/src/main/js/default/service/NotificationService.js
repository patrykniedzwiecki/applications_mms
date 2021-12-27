/**
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import wantAgent from '@ohos.wantAgent';
import notify from '@ohos.notification';
import common from '../pages/common_constants.js';
import mmsLog from '../utils/MmsLog.js';
import conversationService from '../service/ConversationService.js';
const label = 'notification_';

export default {

    /**
     * 发送通知
     * @param actionData 通知参数
     * @return
     */
    sendNotify(actionData) {
        // 创建Want信息
        let wantAgentInfo = this.buildWantAgentInfo(actionData);
        // 构建发送请求
        let notificationRequest = this.buildNotificationRequest(actionData);
        wantAgentInfo.requestCode = actionData.msgId;
        this.getWantAgent(wantAgentInfo, (data) => {
            notificationRequest.wantAgent = data;
            notificationRequest.id = actionData.msgId;
            notificationRequest.label = label + actionData.msgId;
            notify.publish(notificationRequest);
            mmsLog.log('notification finished');
        });
    },

    /**
     * 创建需要发送的跳转的Want
     * @param agentInfo 参数
     * @param callback 回调
     * @return
     */
    getWantAgent(agentInfo, callback) {
        mmsLog.log('notification start:' + agentInfo);
        wantAgent.getWantAgent(agentInfo).then(data1 => {
            callback(data1);
        });
    },

    /**
     * 构建分布式拉起参数
     * @param actionData 参数
     * @return
     */
    buildWantAgentInfo(actionData) {
        let parameters = {};
        parameters.pageFlag = 'conversation';
        parameters.contactObjects = actionData.contactObjects;
        let wantAgentInfo = {
            wants: [
                {
                    deviceId: 'receive',
                    bundleName: common.string.BUNDLE_NAME,
                    abilityName: common.string.ABILITY_NAME,
                    entities: [common.string.COMMON_ENTITIES],
                    type: 'MIMETYPE',
                    uri: parameters.pageFlag,
                    parameters: parameters,
                }
            ],
            operationType: wantAgent.OperationType.START_ABILITY,
            requestCode: 0
        };
        return wantAgentInfo;
    },

    /**
     * 构建通知参数
     * @param actionData 参数
     * @return
     */
    buildNotificationRequest(actionData) {
        let message = actionData.message;
        let notificationRequest = {
            content:{
                contentType: notify.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
                normal: {
                    title: message.title,
                    text: message.text
                },
            },
            wantAgent: '',
            slotType: notify.SlotType.OTHER_TYPES,
            deliveryTime: new Date().getTime()
        };
        return notificationRequest;
    },
    cancelMessageNotify(actionData, callback) {
        conversationService.queryMessageDetail(actionData, res => {
            if (res.code == common.int.FAILURE || res.response.length == 0) {
                callback(common.int.FAILURE);
            }
            let count = 0;
            for(let item of res.response) {
                this.cancelNotify(parseInt(item.id), result => {
                    mmsLog.log('cancelNotify, success: ' + result);
                    count ++;
                    if (count == res.response.length) {
                        callback(common.int.SUCCESS);
                    }
                });
            }
        });
    },
    cancelNotify(msgId, callback) {
        notify.cancel(msgId, label + msgId, (err, data) => {
            if (err) {
                mmsLog.log('cancelNotify, error: ' + err);
                callback(common.int.FAILURE);
            }
            mmsLog.log('cancelNotify success: ' + data);
            callback(common.int.SUCCESS);
        });
    },
    cancelAllNotify() {
        let promise = notify.cancelAll();
        promise.then((ret) => {
            mmsLog.log('cancelAllNotify success: ' + ret);
        }).catch((err) => {
            mmsLog.log('cancelAllNotify, error: ' + err);
        });
    }
};