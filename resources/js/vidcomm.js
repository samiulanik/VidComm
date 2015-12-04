/*! videojs-markers - v0.4.0 - 2014-12-14
 * Copyright (c) 2014 ; Licensed  */
/*! videojs-markers !*/
'use strict';

(function($, videojs, undefined) {

    // create a non-colliding random number
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    function registerVideoJsMarkersPlugin(argument) {

        var markers = {},
            markersList = [], // list of markers sorted by time
            videoWrapper = $(this.el()),
            player = this,
            commentContainer = null,
            belowCommentContainer = null,
            maxCounter = 0,
            masterList = [],
            commentList = [],
            draw = null,
            line = null,
            markerPositionList = [],
            colorList = [],
            checkList = {},
            checkTrueList = [],
            constantHeight = 26,
            generalCommentFlag = false,
            commentCounter = 0,
            initialMarkerLength = 0,
            sideCommentOption = "all",
            answerList = [];
        var running = false;
        var studyTime = 0;
        var timerID = null;
        //var now = null;
        var logArray = [];
        var markerClickEventLogArray = [];
        var radioClickEventLogArray = [];
        var typeCheckboxClickEventLogArray = [];
        var seekbarClickEventLogArray = [];
        var commentClickEventLogArray = [];
        var scrollEventLogArray = [];
        var studyMinutes = 5;
        var studySeconds = studyMinutes * 60;



        function sortMarkersList() {
            // sort the list by time in asc order
            markersList.sort(function(a, b) {
                return a.time - b.time;
            });
        }


        function sortCommentList() {
            commentList.sort(function(a, b) {
                return a.markerPositionTime - b.markerPositionTime;
            });

        }


        function getMaxCommentCount() {

            for (var i = 0; i < markerPositionList.length; i++) {
                var counter = 0;
                for (var j = 0; j < commentList.length; j++) {

                    if ($.inArray(commentList[j].type, checkTrueList) != -1 && commentList[j].markerPositionTime == markerPositionList[i])
                        counter++;

                }
                if (counter > maxCounter)
                    maxCounter = counter;
            }

        }

        function getCommentPositionCount(markerTime) {
            var counter = {};

            counter.sumCount = 0;
            counter.typeCount = [];
            counter.typeCount["appreciation"] = 0;
            counter.typeCount["suggestion"] = 0;
            counter.typeCount["troubleshooting"] = 0;
            counter.typeCount["question"] = 0;
            counter.typeCount["link"] = 0;

            for (var j = 0; j < commentList.length; j++) {
                if ($.inArray(commentList[j].type, checkTrueList) != -1 && commentList[j].markerPositionTime == markerTime) {
                    counter.sumCount++;
                    counter.typeCount[commentList[j].type]++;
                }
            }
            return counter;
        }


        function findMarkerPositions() {
            $.each(commentList, function(i, comment) {
                if ($.inArray(comment.markerPositionTime, markerPositionList) === -1 && $.inArray(comment.type, checkTrueList) != -1)

                    if (comment.markerPositionTime != -1)
                        markerPositionList.push(comment.markerPositionTime);

            });

        }


        function initializeCheckList() {
            checkList["appreciation"] = true;
            checkList["suggestion"] = true;
            checkList["question"] = true;
            checkList["troubleshooting"] = true;
            checkList["link"] = true;
        }


        function getCheckedList() {
            for (var key in checkList) {
                if (checkList[key]) {
                    checkTrueList.push(key);
                }
            }
        }


        function createCommentList() {
            var tempList = JSON.parse(JSON.stringify(masterList));;
            for (var i = 0; i < tempList.length; i++) {
                var tempComment = {};
                tempComment.userName = tempList[i].userName
                tempComment.commentId = tempList[i].commentId
                tempComment.time = tempList[i].time;
                tempComment.text = tempList[i].text;
                tempComment.type = tempList[i].type;
                tempComment.key = tempList[i].commentId
                tempComment.contentPosition = tempList[i].contentPosition;
                tempComment.markerPositionTime = tempComment.time == -1 ? -1 : 3 * (2 * Math.ceil(tempList[i].time / 6) - 1);
                commentList.push(tempComment);
            }
            commentCounter = commentList.length;
            initialMarkerLength = commentList.length;
            sortCommentList();
        }

        function addNewComment(newComment) {

            var tempComment = {};
            tempComment.time = newComment.time;
            tempComment.text = newComment.text;
            tempComment.type = newComment.type;
            tempComment.key = "comment-" + commentCounter;
            tempComment.contentPosition = newComment.contentPosition;
            tempComment.markerPositionTime = tempComment.time == -1 ? -1 : 3 * (2 * Math.ceil(newComment.time / 6) - 1);
            //console.log(tempComment);
            //console.log(commentList);
            commentList.push(tempComment);
            sortCommentList();
        }


        function getNonZeroCounter(typeCounter) {

            var nonZeroList = [];

            for (var key in typeCounter) {

                if (typeCounter[key] > 0)
                    nonZeroList.push(key);

            }

            return nonZeroList;

        }




        function addMarkerPosition() {
            var duration = player.duration();
            var colorMarker = [];

            colorMarker['default'] = "pin-half-fill-outer-default";
            colorMarker['appreciation'] = "pin-half-fill-outer-appreciation";
            colorMarker['suggestion'] = "pin-half-fill-outer-suggestion";
            colorMarker['question'] = "pin-half-fill-outer-question";
            colorMarker['troubleshooting'] = "pin-half-fill-outer-troubleshooting";
            colorMarker['link'] = "pin-half-fill-outer-link";

            getMaxCommentCount();


            $.each(markerPositionList, function(index, markerTime) {
                var marker = {};
                marker.time = markerTime;
                marker.position = (marker.time / duration) * 100;
                marker.key = generateUUID();
                marker.div = $("<div class='vjs-marker' data-marker-index='" + marker.key + "'></div>");

                if (checkTrueList.length == 1) {

                    var counter = getCommentPositionCount(marker.time);
                    var nonZeroList = getNonZeroCounter(counter.typeCount);
                    marker.div.addClass(colorMarker[checkTrueList[0]]).append("<div class='pin-half-fill-inside'></div>")
                        .css({
                            "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                            "left": marker.position + '%',
                            "top": -20 + 'px'
                        });


                    var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                    marker.div.find('.pin-half-fill-inside').css({
                        "height": height + 'px'
                    });

                } else if (checkTrueList.length == 2) {

                    var counter = getCommentPositionCount(marker.time);

                    var nonZeroList = getNonZeroCounter(counter.typeCount);

                    if (nonZeroList.length == 1) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class='pin-half-fill-inside'></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });


                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });


                    } else {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class='pin-half-fill-inside'></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var tempHeight = height + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": tempHeight + 'px'
                        });


                    }

                } else if (checkTrueList.length == 3) {

                    var counter = null;

                    counter = getCommentPositionCount(marker.time);

                    var nonZeroList = null;

                    nonZeroList = getNonZeroCounter(counter.typeCount);

                    if (nonZeroList.length == 1) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class='pin-half-fill-inside'></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });


                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });


                    } else if (nonZeroList.length == 2) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class='pin-half-fill-inside'></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var tempHeight = height + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": tempHeight + 'px'
                        });

                    } else if (nonZeroList.length == 3) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "> <div class='pin-half-fill-inside'></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height2 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });

                    }

                } else if (checkTrueList.length == 4) {
                    var counter = null;
                    counter = getCommentPositionCount(marker.time);
                    var nonZeroList = null;
                    nonZeroList = getNonZeroCounter(counter.typeCount);

                    if (nonZeroList.length == 1) {

                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class='pin-half-fill-inside'></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });


                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });


                    } else if (nonZeroList.length == 2) {

                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class='pin-half-fill-inside'></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var tempHeight = height + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": tempHeight + 'px'
                        });





                    } else if (nonZeroList.length == 3) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "> <div class='pin-half-fill-inside'></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height2 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });


                    } else if (nonZeroList.length == 4) {



                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "><div class=" + colorMarker[nonZeroList[3]] + "><div class='pin-half-fill-inside'></div></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height3 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[3]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[3]]).css({
                            "height": height3 + 'px'
                        });

                        var height2 = height3 + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });



                    }

                } else if (checkTrueList.length == 5) {

                    var counter = getCommentPositionCount(marker.time);

                    var nonZeroList = getNonZeroCounter(counter.typeCount);

                    if (nonZeroList.length == 1) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class='pin-half-fill-inside'></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });


                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });


                    } else if (nonZeroList.length == 2) {


                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class='pin-half-fill-inside'></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var tempHeight = height + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": tempHeight + 'px'
                        });



                    } else if (nonZeroList.length == 3) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "> <div class='pin-half-fill-inside'></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height2 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });

                    } else if (nonZeroList.length == 4) {
                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "><div class=" + colorMarker[nonZeroList[3]] + "><div class='pin-half-fill-inside'></div></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height3 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[3]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[3]]).css({
                            "height": height3 + 'px'
                        });

                        var height2 = height3 + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });

                    } else if (nonZeroList.length == 5) {

                        marker.div.addClass(colorMarker[nonZeroList[0]]).append("<div class=" + colorMarker[nonZeroList[1]] + "><div class=" + colorMarker[nonZeroList[2]] + "><div class=" + colorMarker[nonZeroList[3]] + "><div class=" + colorMarker[nonZeroList[4]] + "><div class='pin-half-fill-inside'></div></div></div></div></div>")
                            .css({
                                "margin-left": -parseFloat(marker.div.css("width")) / 2 + 'px',
                                "left": marker.position + '%',
                                "top": -20 + 'px'
                            });

                        var height = constantHeight * (1 - (counter.sumCount / maxCounter));
                        marker.div.find('.pin-half-fill-inside').css({
                            "height": height + 'px'
                        });

                        var height4 = height + (constantHeight - height) * (counter.typeCount[nonZeroList[4]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[4]]).css({
                            "height": height4 + 'px'
                        });

                        var height3 = height4 + (constantHeight - height) * (counter.typeCount[nonZeroList[3]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[3]]).css({
                            "height": height3 + 'px'
                        });

                        var height2 = height3 + (constantHeight - height) * (counter.typeCount[nonZeroList[2]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[2]]).css({
                            "height": height2 + 'px'
                        });

                        var height1 = height2 + (constantHeight - height) * (counter.typeCount[nonZeroList[1]] / maxCounter);
                        marker.div.find('.' + colorMarker[nonZeroList[1]]).css({
                            "height": height1 + 'px'
                        });


                    }

                }

                videoWrapper.find('.vjs-progress-control').append(marker.div);
                markers[marker.key] = marker;
                markersList.push(marker);

                // register event handlers
                //bind click event to seek to marker time
                marker.div.on('click', function(e) {
                    player.pause();
                    var key = $(this).data('marker-index');
                    player.currentTime(markers[key].time);
                });

                markerClickEvent(marker.div, nonZeroList);

            });
        }


        function initializeColor() {
            colorList["appreciation"] = "#A8CD1B";
            colorList["suggestion"] = "#ffe658";
            colorList["question"] = "#67BCDB";
            colorList["troubleshooting"] = "#118C4E";
            colorList["link"] = "#DF3D82";
        }



        function markerClickEvent(markerDiv, nonZeroList) {



            markerDiv.on('mouseover', function() {

                var id = $(this).data('marker-index');
                var markerTime = markers[id].time;

                var count = getCommentPositionCount(markerTime);

                markerDiv.find('.pin-half-fill-inside').append("<div class = 'vjs-inner-count-notification' style='position: relative; bottom:-30px;'>" + count.sumCount + "</div>");

            }).on('click', function() {

                commentContainer.empty();

                var id = $(this).data('marker-index');
                var markerTime = markers[id].time;
                var now = new Date()
                now = now.getTime()
                var count = getCommentPositionCount(markerTime);
                var currentStudyTime = studySeconds - ((studyTime - now) / 1000)
                var logData = {
                    anchorTime: markers[id].time,
                    eventTime: currentStudyTime,
                    numberOfCommentsInMarker: count.sumCount,
                    listOfCommentTypesInMarker: nonZeroList.join(' '),
                    listOfCheckedTypesInGlobal: checkTrueList.join(' ')
                }
                markerClickEventLogArray.push(logData)
                console.log(logData);
                var textCotentHighlight = "please click the comment to highlight the position inside video."

                for (var i = 0; i < commentList.length; i++) {

                    if (markerTime == commentList[i].markerPositionTime && commentList[i].markerPositionTime != -1 && $.inArray(commentList[i].type, checkTrueList) != -1) {

                        if (commentList[i].contentPosition == "none")
                            commentContainer.append("<li class ='vjs-comment-list' id='" + commentList[i].key + "' style='border-right:" + colorList[commentList[i].type] + " solid 5px;'>" + "<div class='l-media'>" + "<div class='l-media__figure'>" + "<div class = 'comment-profile-pic'>" + "</div>" + "</div>" + "<div class='l-media__body'>" + "<div class = 'comment-user-name'>" + commentList[i].userName + "</div>" + "<div class='.vjs-bottom-comment-list'>" + commentList[i].text + "</div></div></div></li>")
                        else
                            commentContainer.append("<li class ='vjs-comment-list' id='" + commentList[i].key + "' style='border-right:" + colorList[commentList[i].type] + " solid 5px;'>" + "<div class='l-media'>" + "<div class='l-media__figure'>" + "<div class = 'comment-profile-pic'>" + "</div>" + "</div>" + "<div class='l-media__body'>" + "<div class = 'comment-user-name'>" + commentList[i].userName + "</div>" +  "<div class='.vjs-bottom-comment-list'>" + commentList[i].text + "<br> <span style='color:#ff0000;'>" + textCotentHighlight + "</span></div></div></div></li>")


                        commentContainer.css({
                            "visibility": 'visible',
                        });

                    }
                }
                //logAnswer();


            }).on('mouseout', function() {
                markerDiv.find('.vjs-inner-count-notification').remove();
            });

        }

        function contentHightlight(x1, y1, x2, y2) {

            //console.log(x1+","+y1);
            //console.log(x2+","+y2);



            if (!$('#line').is(':empty'))
                $('#line').empty();


            draw = SVG('line').size(1200, 600);
            line = draw.line(x1, y1, x2, y2).stroke({
                width: 3,
                color: 'red'
            });

            var marker = draw.marker(10, 15, function(add) {
                add.path('M2,2 L2,13 L8,7 L2,2').fill('red');
            });

            line.marker('end', marker);


        }



        function commentClick() {

            $(document).on('click', 'li', function(event) {

                for (var i = 0; i < commentList.length; i++) {
                    if (commentList[i].key == this.id && commentList[i].markerPositionTime != -1 && commentList[i].contentPosition != "none") {
                        //console.log(this.id);
                        var x1 = event.pageX;
                        var y1 = event.pageY;



                        var temp = commentList[i].contentPosition.match(/[0-9]+/g);
                        var x2 = parseInt(temp[0], 10);
                        var y2 = parseInt(temp[1], 10);


                        var now = new Date()
                        now = now.getTime()
                            //alert("start timer");
                        var currentStudyTime = studySeconds - ((studyTime - now) / 1000);

                        var commentId = commentList[i].key;

                        var logData = {commentId: commentId, eventTime: currentStudyTime }

                        commentClickEventLogArray.push(logData);


                        contentHightlight(x1 - 500, y1, x2, y2);


                    }
                }
            });




            $(document).on('mouseover', 'li', function(event) {

                for (var i = 0; i < commentList.length; i++) {
                    if (commentList[i].key == this.id && commentList[i].markerPositionTime != -1 && commentList[i].contentPosition != "none")
                        commentContainer.find("#" + this.id).css({
                            "cursor": 'pointer'
                        });
                }

            });

            $(document).mouseup(function(e) {

                if (draw != null && draw.has(line)) {
                    draw.clear();
                    $('#line').empty();
                }
            });

            $(document).dblclick(function(e) {


                if (sideCommentOption != "all" || sideCommentOption != "general") {

                    if (!commentContainer.is(e.target) && commentContainer.has(e.target).length === 0) {
                        //console.log("check");
                        commentContainer.html("");
                        commentContainer.css({
                            "visibility": 'hidden'
                        });

                    }
                }

            });

        }

        function logEvents() {

            var startScroll = 0;
            var endScroll = 0;
            $(".checkbox").click(function() {

                var now = new Date()
                now = now.getTime()
                    //alert("start timer");
                var currentStudyTime = studySeconds - ((studyTime - now) / 1000);
                var logData = {
                    checkboxId: this.id,
                    checkboxStatus: $('#' + this.id).prop('checked'),
                    checkboxClickTime: currentStudyTime,
                    checkboxCheckedListCurrent: checkTrueList.join(' ')
                }
                typeCheckboxClickEventLogArray.push(logData);
                console.log(logData);
            });

            $(".radio-button").click(function() {

                var now = new Date()
                now = now.getTime()
                var currentStudyTime = studySeconds - ((studyTime - now) / 1000);
                var logData = {
                    radioId: this.id,
                    radioClickTime: currentStudyTime,
                    checkboxCheckedListCurrent: checkTrueList.join(' ')
                }
                radioClickEventLogArray.push(logData);
                console.log(logData);
            });

            $(".vjs-progress-holder").on('mouseup', function() {

                var now = new Date()
                now = now.getTime()
                var currentStudyTime = studySeconds - ((studyTime - now) / 1000);
                var logData = {
                    seekbarPoisitionTime: player.currentTime(),
                    seekBarClickTime: currentStudyTime
                }
                seekbarClickEventLogArray.push(logData);
                console.log(logData);
            });

            $(".comment-container").scroll($.debounce(250, true, function() {
                //console.log("started scroll");
                var now = new Date();
                now = now.getTime()
                startScroll = studySeconds - ((studyTime - now) / 1000);

            }));
            $(".comment-container").scroll($.debounce(250, function() {

                //console.log("end scroll");
                var now = new Date();
                now = now.getTime()
                endScroll = studySeconds - ((studyTime - now) / 1000);

                var logData = {
                    scrollStartTime: startScroll,
                    scrollTime: (endScroll - startScroll)
                }

                scrollEventLogArray.push(logData);
                console.log(logData);
                //alert((endScroll - startScroll) / 1000)
            }));


        }

        function removeMarkers() {

            var indexArray = [];
            for (var i = 0; i < markersList.length; i++) {
                indexArray.push(i);
            }
            for (var i = 0; i < indexArray.length; i++) {
                var index = indexArray[i];
                var marker = markersList[index];
                if (marker) {
                    delete markers[marker.key];
                    markersList[index] = null;

                    // delete from dom
                    videoWrapper.find(".vjs-marker[data-marker-index='" + marker.key + "']").remove();
                }
            }

            markersList.length = 0;
            checkTrueList.length = 0;
            maxCounter = 0;
            markerPositionList.length = 0;

            commentContainer.empty();
            commentContainer.css({
                "visibility": 'hidden',
            });

            // belowCommentContainer.empty();
            // belowCommentContainer.css({
            //     "visibility": 'visible',
            // });
            $("#vjs-tip").css({
                "visibility": 'hidden'
            });
        }

        function timedCommentInteraction() {

            //console.log("test");
            $(".vjs-progress-control").on("mouseup", function(event) {


                if ($("#timed-comment").is(':checked')) {

                    var minutes, seconds, seekBar, timeInSeconds;
                    seekBar = player.controlBar.progressControl.seekBar;
                    var mousePosition = (event.pageX - $(seekBar.el()).offset().left) / seekBar.width();
                    timeInSeconds = mousePosition * player.duration();
                    if (timeInSeconds === player.duration()) {
                        timeInSeconds = timeInSeconds - 0.1;
                    }
                    var position = ((player.currentTime() - .5) / player.duration()) * 100;
                    minutes = Math.floor(timeInSeconds / 60);
                    seconds = Math.floor(timeInSeconds - minutes * 60);
                    if (seconds < 10) {
                        seconds = "0" + seconds;
                    }
                    //$('#vjs-tip-inner').text("" + minutes + ":" + seconds);
                    //barHeight = $('.vjs-control-bar').height();
                    // $("#vjs-tip").css("top", "" + (event.pageY - $(this).offset().top - barHeight - 30) + "px").css("left", "" + (event.pageX - $(this).offset().left - 20) + "px");
                    $("#vjs-tip-arrow").css("top", "" + -20 + "px").css("left", "" + position + "%");

                }


            });
            // $(".vjs-progress-control, .vjs-play-control").on("mouseout", function() {
            //     $("#vjs-tip").css("visibility", "hidden");
            // });



            $("#timed-comment").click(function() {
                //console.log("test");
                if ($("#timed-comment").is(':checked')) {

                    player.pause();

                    var barHeight, minutes, seconds, seekBar, timeInSeconds;
                    //seekBar = player.controlBar.progressControl.seekBar;
                    var position = ((player.currentTime() - .5) / player.duration()) * 100;
                    //var mousePosition = (event.pageX - $(seekBar.el()).offset().left) / seekBar.width();
                    timeInSeconds = player.currentTime();
                    // if (timeInSeconds === player.duration()) {
                    //     timeInSeconds = timeInSeconds - 0.1;
                    // }
                    minutes = Math.floor(timeInSeconds / 60);
                    seconds = Math.floor(timeInSeconds - minutes * 60);
                    if (seconds < 10) {
                        seconds = "0" + seconds;
                    }
                    /* $('#vjs-tip-inner').text("" + minutes + ":" + seconds);
                     barHeight = $('.vjs-control-bar').height();*/
                    $("#vjs-tip-arrow").css("top", "" + -20 + "px").css("left", "" + position + "%").css("visibility", "visible");



                } else {
                    $("#vjs-tip-arrow").css({
                        "visibility": 'hidden'
                    });

                }
            });

            var start;
            var end;
            var startTime;
            var endTime;
            $('#vjs-tip-arrow').draggable({
                axis: 'x',
                containment: "parent",
                start: function() {

                    start = $(this).position().left;
                    startTime = player.currentTime();


                },

                stop: function() {
                    end = $(this).position().left;

                },

                drag: function() {
                    var temp;
                    var currentPos = $(this).position().left;
                    if (start < currentPos) {
                        var temp = currentPos - start;
                        //console.log("1"+ temp);
                        var offset = (temp / 1200) * player.duration();
                        player.currentTime(startTime + offset);
                        //c.log(temp);
                        //updateProgress(temp);
                    } else {

                        var temp = start - currentPos;
                        //console.log("2"+temp);
                        var offset = (temp / 1200) * player.duration();
                        player.currentTime(startTime - offset);
                        //c.log(temp);
                        //updateProgress(temp);
                    }

                }

            });



        }

        /*        function displayBottomCommentSection(type) {

                    commentType = type;

                    if (commentType == "all") {

                        belowCommentContainer.empty();

                        belowCommentContainer.append("All Comments (" + commentList.length + ") <br><br><br>")

                        for (var i = 0; i < commentList.length; i++) {


                            belowCommentContainer.append("<li class ='vjs-bottom-comment-list' id='" + commentList[i].key + "' style='border-left:" + colorList[commentList[i].type] + " solid 5px;'>" + commentList[i].text + "</li>")
                            belowCommentContainer.css({
                                "visibility": 'visible',
                            });


                        }


                    } else {


                        belowCommentContainer.empty();
                        var counter = 0;
                        for (var i = 0; i < commentList.length; i++) {

                            if (commentList[i].markerPositionTime == -1 && $.inArray(commentList[i].type, checkTrueList) != -1) {
                                counter++
                            }
                        }

                        belowCommentContainer.append("General Comments (" + counter + ") <br><br><br>")

                        for (var i = 0; i < commentList.length; i++) {

                            if (commentList[i].markerPositionTime == -1 && $.inArray(commentList[i].type, checkTrueList) != -1) {
                                belowCommentContainer.append("<li class ='vjs-bottom-comment-list' id='" + commentList[i].key + "' style='border-left:" + colorList[commentList[i].type] + " solid 5px;'>" + commentList[i].text + "</li>")
                                belowCommentContainer.css({
                                    "visibility": 'visible',
                                });

                            }
                        }
                    }

                }*/



        function startTimer() {
            running = true
            var now = new Date()
            var now = now.getTime()
                // change last multiple for the number of minutes
            studyTime = now + (1000 * studySeconds)
            showCountDown()
        }

        function showCountDown() {
            var now = new Date()
            now = now.getTime()
            if (studyTime - now <= 0) {
                stopTimer()

                alert("Time is up.")
            } else {
                var delta = new Date(studyTime - now)
                var theMin = delta.getMinutes()
                var theSec = delta.getSeconds()
                var theTime = theMin
                theTime += ((theSec < 10) ? ":0" : ":") + theSec
                    //document.forms[0].timerDisplay.value = theTime
                $('#timeDisplay').text(theTime);

                if (running) {
                    timerID = setTimeout(showCountDown, 1000)
                }
            }
        }

        function stopTimer() {
            clearTimeout(timerID)
            running = false
            var now = new Date()
            now = now.getTime()
            var requiredTime = studySeconds - (studyTime - now) / 1000;
            var videoSrc = player.currentSrc();
            var videoId = videoSrc.replace('http://localhost:5000/static/videos/photoshop_', '')
            videoId = videoId.replace('.mp4', '')
            var filePath = window.location.pathname;
            var filename = filePath.substring(filePath.lastIndexOf('/') + 1);
            var systemName = filename.replace('_task_1', ' ')
            var taskNo = filename.replace('categorization_task_', ' ')
                //console.log(videoId + " "+ systemName);
                //var logDump = JSON.stringify(logArray);
            var send = JSON.stringify({
                participantId: 1,
                system: systemName.replace(/\s/g, ''),
                videoId: videoId,
                task: parseInt(taskNo),
                time: requiredTime,
                markerClickEventLog: markerClickEventLogArray,
                radioClickEventLog: radioClickEventLogArray,
                typeCheckboxClickEventLog: typeCheckboxClickEventLogArray,
                seekbarClickEventLog: seekbarClickEventLogArray,
                scrollEventLog: scrollEventLogArray,
                commentClickEventLog: commentClickEventLogArray

            });
            //console.log(requiredTime+" "+answerList);
            $.ajax({
                url: '/saveLog',
                type: 'POST',
                data: send,
                contentType: "application/json",
                dataType: 'json',
                success: function(response) {
                    // console.log(response);
                },
                error: function(error) {
                    //console.log(error);
                }
            });

            player.pause();

        }


        function timeActivity() {

            $("#startTimeButton").click(function() {

                //alert("start timer");
                startTimer();

            });

            $("#submitAnswerButton").click(function() {

                stopTimer();

            });

        }


        function displaySideCommentSection(option) {

            if (option == "all") {

                commentContainer.empty();


                var counter = 0;
                for (var i = 0; i < commentList.length; i++) {

                    if ($.inArray(commentList[i].type, checkTrueList) != -1) {
                        counter++
                    }
                }

                commentContainer.append("All Comments (" + commentList.length + ") <br><br><br>")

                for (var i = 0; i < commentList.length; i++) {

                    if ($.inArray(commentList[i].type, checkTrueList) != -1) {
                        commentContainer.append("<li class ='vjs-comment-list' id='" + commentList[i].key + "' style='border-right:" + colorList[commentList[i].type] + " solid 5px;'>" + "<div class='l-media'>" + "<div class='l-media__figure'>" + "<div class = 'comment-profile-pic'>" + "</div>" + "</div>" + "<div class='l-media__body'>" + "<div class = 'comment-user-name'>" + commentList[i].userName + "</div>" + "<div class='.vjs-bottom-comment-list'>" + commentList[i].text + "</div></div></div></li>")
                        commentContainer.css({
                            "visibility": 'visible',
                        });


                    }
                }

            } else if (option == "general") {

                commentContainer.empty();
                var counter = 0;
                for (var i = 0; i < commentList.length; i++) {

                    if (commentList[i].markerPositionTime == -1 && $.inArray(commentList[i].type, checkTrueList) != -1) {
                        counter++
                    }
                }

                commentContainer.append("General Comments (" + counter + ") <br><br><br>")

                for (var i = 0; i < commentList.length; i++) {

                    if (commentList[i].markerPositionTime == -1 && $.inArray(commentList[i].type, checkTrueList) != -1) {
                        commentContainer.append("<li class ='vjs-comment-list' id='" + commentList[i].key + "' style='border-right:" + colorList[commentList[i].type] + " solid 5px;'>" + "<div class='l-media'>" + "<div class='l-media__figure'>" + "<div class = 'comment-profile-pic'>" + "</div>" + "</div>" + "<div class='l-media__body'>" + "<div class = 'comment-user-name'>" + commentList[i].userName + "</div>" + "<div class='.vjs-bottom-comment-list'>" + commentList[i].text + "</div></div></div></li>")
                        commentContainer.css({
                            "visibility": 'visible',
                        });


                    }
                }
                //logAnswer();



            }

        }

        // function logAnswer() {
        //     $(".checkbox-inside").click(function() {
        //         answerList.push(this.id);
        //     });
        // }


        function initializeCommentContainer() {
            commentContainer = $(".comment-container");
            belowCommentContainer = $(".comment-container-below");
        }

        function initializeTimedCommentInteraction() {

            //console.log("testing");
            var markerTip = $("<div id='vjs-tip-arrow'></div>");
            videoWrapper.find(".vjs-progress-control").append(markerTip);
            $("#vjs-tip").css({
                "visibility": "hidden"
            });

        }

        function initialize() {

            masterList = JSON.parse(JSON.stringify(argument.markers));
            initializeCheckList();
            initializeCommentContainer();
            initializeTimedCommentInteraction();
            createCommentList();
            getCheckedList()
            timedCommentInteraction();
            initializeColor();
            logEvents();
            //findMarkerPositions();
            //addMarkerPosition();
            //commentClick();
            //displayBottomCommentSection("all");
            displaySideCommentSection("all");
            //saveAnswer();
            timeActivity();


        }



        player.on("loadedmetadata", function() {

            initialize();

        });
        // setup the plugin after we loaded video's meta data


        player.markers = {
            checkboxClickAction: function(type, checked, timeType) {


                if (timeType == "time") {

                    checkList[type] = checked;
                    removeMarkers();
                    getCheckedList();
                    findMarkerPositions();
                    addMarkerPosition();
                    commentClick();

                } else if (timeType == "general") {

                    checkList[type] = checked;
                    removeMarkers();
                    getCheckedList();
                    displaySideCommentSection(timeType);


                } else {
                    checkList[type] = checked;
                    removeMarkers();
                    getCheckedList();
                    //findMarkerPositions();
                    //addMarkerPosition();
                    //commentClick();
                    displaySideCommentSection(timeType);


                }

            },

            total: function(checked, timeType) {


             if(timeType=="all"){

                
                    if (checked) {

                        for (var key in checkList) {
                            checkList[key] = true;
                        }
                        removeMarkers();
                        getCheckedList();
                        //findMarkerPositions();
                        //addMarkerPosition();
                        //displayBottomCommentSection();
                        //commentClick();
                        displaySideCommentSection("all")
                    } else {
                        for (var key in checkList) {
                            checkList[key] = false;
                        }
                        removeMarkers();

                    }



             } 



              else  if (timeType == "general"){

                    if (checked) {

                        for (var key in checkList) {
                            checkList[key] = true;
                        }
                        removeMarkers();
                        getCheckedList();
                        //findMarkerPositions();
                        //addMarkerPosition();
                        //displayBottomCommentSection();
                        //commentClick();
                        displaySideCommentSection("general")
                    } else {
                        for (var key in checkList) {
                            checkList[key] = false;
                        }
                        removeMarkers();

                    }

                } else if (timeType == "time"){

                    if (checked) {

                        for (var key in checkList) {
                            checkList[key] = true;
                        }
                        removeMarkers();
                        getCheckedList();
                        findMarkerPositions();
                        addMarkerPosition();
                        //displayBottomCommentSection();
                        commentClick();
                        //displaySideCommentSection("general")
                    } else {
                        for (var key in checkList) {
                            checkList[key] = false;
                        }
                        removeMarkers();

                    }

                } 



            },

            radioButtonClickAction: function(value) {
                sideCommentOption = value;
                //generalCommentFlag = checked;
                removeMarkers();
                getCheckedList();
                if (value == "general") {

                    displaySideCommentSection(value);


                } else if (value == "time") {

                    removeMarkers();
                    getCheckedList();
                    findMarkerPositions();
                    addMarkerPosition();
                    commentClick();

                } else if (value == "all") {
                    // removeMarkers();
                    // getCheckedList();
                    // //findMarkerPositions();
                    //addMarkerPosition();
                    // commentClick();
                    displaySideCommentSection(value);

                }
                /* else if (value == "gt") {

                    //removeMarkers();
                    //getCheckedList();
                    findMarkerPositions();
                    addMarkerPosition();
                    commentClick();
                    displayBottomCommentSection(value);

                }*/


            },



            postComment: function(newComment, timeType) {



                removeMarkers();
                addNewComment(newComment);
                getCheckedList();
                commentCounter++;

                if (timeType == "time") {
                    findMarkerPositions();
                    addMarkerPosition();
                    commentClick();

                } else if (timeType == "general") {
                    displaySideCommentSection(timeType);
                } else if (timeType == "gt") {
                    findMarkerPositions();
                    addMarkerPosition();
                    commentClick();
                    displaySideCommentSection(timeType);
                } else {
                    //findMarkerPositions();
                    //addMarkerPosition();
                    //commentClick();
                    displaySideCommentSection(timeType);
                }

            }

        };



    }


    videojs.plugin('markers', registerVideoJsMarkersPlugin);

})(jQuery, window.videojs);
