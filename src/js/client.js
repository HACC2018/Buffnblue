"use strict"; /* eslint-env browser */ /* global */ /* eslint no-warning-comments: [1, { "terms": ["todo", "fix", "help"], "location": "anywhere" }] */

// Navbar Burger
document.addEventListener("DOMContentLoaded",function(){var t=Array.prototype.slice.call(
document.querySelectorAll(".navbar-burger"),0);t.length>0&&t.forEach(function(t){t.addEventListener("click",function(){
var e=t.dataset.target,n=document.getElementById(e);t.classList.toggle("is-active"),n.classList.toggle("is-active")})})});

// Animate.css Library
// https://github.com/daneden/animate.css
$.fn.extend({
	animateCss: function(animationName, callback) {
		var animationEnd = (function(el) {
			var animations = {
				animation: 'animationend',
				OAnimation: 'oAnimationEnd',
				MozAnimation: 'mozAnimationEnd',
				WebkitAnimation: 'webkitAnimationEnd',
			};

			for (var t in animations) {
				if (el.style[t] !== undefined) {
					return animations[t];
				}
			}
		})(document.createElement('div'));

		this.addClass('animated ' + animationName).one(animationEnd, function() {
			$(this).removeClass('animated ' + animationName);

			if (typeof callback === 'function') callback();
		});

		return this;
	},
});

var socket = io.connect();

socket.emit("refreshRequest");

socket.on("refreshResponse", function connectionReceived (data) {
	// console.log(data);
});

var pages = {
	index:indexPage, 
	teacherMatch:teacherMatchPage, 
	resourceHub:resourceHubPage, 
	creativeSpaces:creativeSpacesPage, 
	login:loginPage, 
	register:registerPage,
	innovationBoard:innovationBoardPage
}

$(document).ready(function() {
	// If logged in, hide login/register buttons & show logout button
	if (localStorage.getItem("myDetails")) {
		$("#navbarLoginButton").addClass("is-actually-invisible");
		$("#navbarRegisterButton").addClass("is-actually-invisible");
		$("#navbarLogoutButton").removeClass("is-actually-invisible");
	} else {
		$("#navbarLogoutButton").addClass("is-actually-invisible");
	}

	// When logout button is clicked
	$("#navbarLogoutButton").click(function() {
		localStorage.removeItem("myDetails");
		window.location.replace("/login.html");
	});

	// Page functions
	pages[$("#pageName").data("pagename")]();
});


function indexPage(){
	$("article.article").animateCss("fadeIn").removeClass("is-invisible");
	if (!localStorage.getItem("myDetails")) {
		$(".introText").animateCss("fadeIn").removeClass("is-actually-invisible");
	}
}

function teacherMatchPage () {
	checkToShowIntro();
	function createTeacherElements(fName, lName, school, department, subject) {
		// Alternatively I could have cloned the template, but this was easier
		var newElement = `<div class='column is-one-quarter'>
		<div class='card'><header class="card-header"><p class="card-header-title">${fName + " " + lName}</p>
		</header><div class="card-content"><div class="level"><div class="level-item has-text-centered">
		</div></div><span><strong>${school}</strong></span><br><span>${department}</span><br><span>${subject}</span>
		<div class="content"></div></div><footer class="card-footer has-text-centered">
		<a class="card-footer-item" href="javascript:alert('Feature coming soon!');">View profile</a>
		<a class="card-footer-item" href="javascript:alert('Feature coming soon!');">Connect</a></footer></div></div>`;
		return newElement;
	}
	//- $("#myDetails").data("details", JSON.stringify(JSON.parse(localStorage.getItem("myDetails"))));
	// - localStorage.setItem("myDetails", JSON.stringify({"fname": "bob", "lname": "bobbing"}))

	// Should probably include something if they try to do stuff without logging in
	if (localStorage.getItem("myDetails")) {
		$("article.article").removeClass("blurredElement");
		var myDetails = JSON.parse(localStorage.getItem("myDetails"));
		$(".myDetailsFName").text(myDetails.fname);
		$(".myDetailsLName").text(myDetails.lname);
		$(".myDetailsSchool").text(myDetails.school);
		$(".myDetailsDepartment").text(myDetails.department);
		$(".myDetailsSubject").text(myDetails.subject);
		// $(".myDetailsHobbies").text(myDetails.hobbies);

		socket.emit("requestUserData", myDetails);

		$("#teacherMatchFilter > .box > label > input[type='checkbox']").on("change", function() {
			socket.emit("requestUserData", myDetails);
		});

		socket.on("userData", function(data) {
			var sortingParameters = {};
			$("#teacherMatchFilter > .box > label > input[type='checkbox']:checked").each(function() {
				sortingParameters[$(this).val()] = myDetails[$(this).val()];
			});

			var sortedObj = _.filter(data, sortingParameters);

			function resetTeacherDisplay(mode) {
				// I get rid of all the teachers everytime they filter or unfilter
				$("#sameSchool").empty();
				$("#sameDepartment").empty();
				$("#sameSubject").empty();
				$("#sameHobbies").empty();
				if (mode === "filter") {
					// If there is a filter, I remove all the headers
					$("#matchedTeachers > h1").addClass("is-invisible");
				} else {
					// I make the headers visible again
					$("#matchedTeachers > h1").removeClass("is-invisible");
				}
			}

			if (_.isEqual(sortedObj, data)) {
				resetTeacherDisplay("default");
				// Each one of the appends of these prints the people under the catagories (this is WITHOUT filter)
				_.forEach(_.filter(data, {"school":myDetails.school}), function(obj) {
					$("#sameSchool").append(createTeacherElements(obj.fname, obj.lname, obj.school, obj.department, obj.subject, obj.hobbies)).animateCss("pulse");
				});
				_.forEach(_.filter(data, {"department":myDetails.department}), function(obj) {
					$("#sameDepartment").append(createTeacherElements(obj.fname, obj.lname, obj.school, obj.department, obj.subject, obj.hobbies)).animateCss("pulse");
				});
				_.forEach(_.filter(data, {"subject":myDetails.subject}), function(obj) {
					$("#sameSubject").append(createTeacherElements(obj.fname, obj.lname, obj.school, obj.department, obj.subject, obj.hobbies)).animateCss("pulse");
				});
				// _.forEach(_.filter(data, {"hobbies":myDetails.hobbies}), function(obj) {
				// 	$("#sameHobbies").append(createTeacherElements(obj.fname, obj.lname, obj.school, obj.department, obj.subject, obj.hobbies)).animateCss("pulse");
				// });
			} else {
				resetTeacherDisplay("filter");
				if (sortedObj.length === 0) {
					$("#sameSchool").append("<p>No matches</p>");
				} else {
					for (var i = 0; i < sortedObj.length; i++) {
						var obj = sortedObj[i];
						// adding filtered people
						$("#sameSchool").append(createTeacherElements(obj.fname, obj.lname, obj.school, obj.department, obj.subject, obj.hobbies)).animateCss("fadeIn");
					}
				}
			}
		});
	} else {
			$(".introText").animateCss("fadeIn").removeClass("is-actually-invisible");
			$("article.article").addClass("blurredElement");
	}
}

function resourceHubPage () {
	checkToShowIntro();
	if (localStorage.getItem("myDetails")) {
		// Quickview
		var quickviews = bulmaQuickview.attach(); // quickviews now contains an array of all Quickview instances

		// Uploading a File
		var $fileUploaded = $("#resourceHubFileUploadInput");
		var fileUploadedYet = false;
		$fileUploaded.on("change", function () {
			if ($fileUploaded[0].files.length > 0) {
				$("#resourceHubFileUploadName").text($fileUploaded[0].files[0].name);
				fileUploadedYet = true;
			}
		});

		// Submitting an Uploaded File
		$("#resourceHubFileUploadButton").click(function () {
			$("#resourceHubFileUploadButton").html('<span class="icon"><i class="fas fa-spinner fa-pulse"></i></span>')
			if (fileUploadedYet) {
				setTimeout(function () {
					$("#resourceHubFileUploadStatus").text("File uploaded successfully! Currently pending review.");
					$("#resourceHubFileUploadButton").html("Upload");
				}, 1500);
			}
		});

		// Your Files
		$(".resourceHubYourResourcesHeading").each(function () {
			$(this).click(function () {
				$(".resourceHubYourResourcesHeading").removeClass("is-active");
				$(this).addClass("is-active");
			});
		});

		// Open Quickview
		// $(".openQuickviewPanel").each(function () {
		// 	$(this).click(function () {
				// 
		// 	})
		// })
		$(".resourceHubQuickviewPostCommentButton").each(function () {
			$(this).click(function () {
				$(this).parent().find("textarea").val("");
			});
		});

		// Open in Innovation Board
		$(".openInInnovationBoardButton").each(function () {
			$(this).click(function () {
				localStorage.setItem("innovationBoardBackdrop", ($(this).parent().parent().find(".resourceCardCoverImage").prop("src")));
				$("article.article").animateCss("fadeOutLeftBig", function () {
					$("article.article").addClass("is-invisible");
				});
				window.location.href = "/innovation-board.html";
			});
		});
	} else {
		$(".introText").animateCss("fadeIn").removeClass("is-actually-invisible");
		$("article.article").addClass("blurredElement");
	}
}

function creativeSpacesPage() {
	checkToShowIntro();

}

function loginPage() {
	$("article.article").animateCss("slideInRight", function () {
		$("article.article").removeClass("is-invisible");
	});
	$("input[type='password']").keyup(function(event) {
		event.preventDefault();
		if (event.keyCode === 13) {
			$("#login").click();
		}
	});
	$("#login").on("click", function() {
		var userData = {
			email:$("input[type='email']").val(),
			password:$("input[type='password']").val()
		}
		// console.log(userData);
		socket.emit("login", userData);

		$("input[type='email']").val("");
		$("input[type='password']").val("");
		socket.on("successLogin", function(data) {
			localStorage.setItem("myDetails", JSON.stringify(data));
			window.location.replace("/teacher-match.html");
		});

		socket.on("failLogin", function() {
			$("#failedPasswordMessage").removeClass("is-invisible");
			$("#login").animateCss("shake");
		});
	});
	
}

function registerPage() {
	$("article.article").animateCss("slideInRight", function () {
		$("article.article").removeClass("is-invisible");
	});
	// Some sort of magical function that givers me completely unique IDs
	function getNewID() {
		var d = new Date().getTime();
		if (window.performance && typeof window.performance.now === "function") {
			d += performance.now();
		}
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	}

	$("input[name='subject']").keyup(function(event) {
		event.preventDefault();
		if (event.keyCode === 13) {
			$("#submit").click();
		}
	});

	$("#submit").on("click", function() {
		if ($("input[name='password']").val() === $("input[name='confirm']").val()) {
			var userData = {
				fname:$("input[name='fname']").val(),
				lname:$("input[name='lname']").val(),
				email:$("input[name='email']").val(),
				password:$("input[name='password']").val(),
				department:$("select[name='department'] option:selected").val(),
				subject:$("input[name='subject']").val(),
				school:$("input[name='school']").val(),
				hobbies:"",
				time:Math.round(new Date().getTime() / 1000)
			}
			socket.emit("newAccount", [getNewID(), userData]);
			localStorage.setItem("myDetails", JSON.stringify(userData));
			window.location.replace("/teacher-match.html");
		} else {
			$("#failedPasswordMessage").removeClass("is-invisible");
			$("#submit").animateCss("shake");
		}
	});
}

function innovationBoardPage () {
	// $("#boardContainer").animateCss("zoomIn");
	$(".innovationBoardLeftColumn").animateCss("slideInLeft", function () {
		$(".innovationBoardLeftColumn").removeClass("is-invisible");
		socket.emit("startedInnovationBoard", JSON.parse(localStorage.getItem("myDetails")));
	});
	// Show Connected Teachers
	socket.on("innovationBoardConnectedClients", function (clients) {
		$("#connectedClients").html("");
		Object.keys(clients).forEach(function (key) {
			// console.log(key, clients[key]);
			// .box(style="margin-bottom: 1rem; padding: 0.5rem;"): span firstname lastname
			$("#connectedClients").append(
				"<div class='box' style='margin-bottom: 1rem; padding: 0.5rem;'>" + clients[key].fname + " " + clients[key].lname + "</div>"
			).animateCss("slideInRight");
		});
	});

	// Update Backdrop
	if (localStorage.getItem("innovationBoardBackdrop")) {
		$("#overlayImg").prop("src", localStorage.getItem("innovationBoardBackdrop"));
	} else {
		$("#overlayImg").prop("src", "https://kathleenhalme.com/images/cells-clipart-biology-teacher-4.jpg");
	}
	
	// Color Button Event Listeners
	$(".innovationBoardColor").each(function () {
		$(this).click(function () {
			$(".innovationBoardColor").removeClass("is-active");
			$(this).addClass("is-active");
		});
	});

	var canvas = document.getElementById("drawCanvas");
	var ctx = canvas.getContext("2d");
	// var color = $("input:checked").attr("data-color");
	var color = $(".innovationBoardColor.is-active").data("color");
	var lineSize = $("#lineSize").val();

	canvas.width = Math.min(document.documentElement.clientWidth, $("#canvasContainer").css("width").replace(/[^-\d\.]/g, ''));
	canvas.height = Math.min(document.documentElement.clientHeight, $("#canvasContainer").css("height").replace(/[^-\d\.]/g, ''));
	ctx.strokeStyle = color;
	ctx.lineWidth = lineSize;
	ctx.lineCap = ctx.lineJoin = "round";

	$("#lineSize").on("change", function() {
		lineSize = $("#lineSize").val();
	});

	$("#colorPalette").on("click", function() {
		// color = $("input:checked").attr("data-color");
		color = $(".innovationBoardColor.is-active").data("color");
		$(".innovationBoardColor.is-active").animateCss("bounce");
	});

	var isTouchSupported = 'ontouchstart' in window;
	var isPointerSupported = navigator.pointerEnabled;
	var isMSPointerSupported =	navigator.msPointerEnabled;
	
	var downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : 'mousedown'));
	var moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove'));
	var upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));

	canvas.addEventListener(downEvent, startDraw, false);
	canvas.addEventListener(moveEvent, draw, false);
	canvas.addEventListener(upEvent, endDraw, false);

	var channel = "draw";

	var pubnub = PUBNUB.init({
		publish_key		 : 'pub-c-39621f2a-a663-45ef-be56-fc24e8d54968',
		subscribe_key	 : 'sub-c-a260a864-df35-11e8-a575-5ee09a206989',
		ssl: true
	});

	pubnub.subscribe({
		channel: channel,
		callback: drawFromStream
	});

	function publish(data) {
		pubnub.publish({
			channel: channel,
			message: data
		});
	 }

	function drawOnCanvas(color, lineWidth, plots) {
		ctx.strokeStyle = color;
		ctx.lineWidth = lineWidth;
		ctx.beginPath();
		ctx.moveTo(plots[0].x, plots[0].y);

		for(var i = 1; i < plots.length; i++) {
			ctx.lineTo(plots[i].x, plots[i].y);
		}
		ctx.stroke();
	}

	function drawFromStream(message) {
		if(!message || message.plots.length < 1) return;
		drawOnCanvas(message.color, message.lineWidth, message.plots);
	}
	
	var isActive = false;
	var plots = [];

	function draw(e) {
		e.preventDefault();
		if(!isActive) return;

		var x = isTouchSupported ? (e.targetTouches[0].pageX - canvas.offsetLeft) : (e.offsetX || e.layerX - canvas.offsetLeft);
		var y = isTouchSupported ? (e.targetTouches[0].pageY - canvas.offsetTop) : (e.offsetY || e.layerY - canvas.offsetTop);

		plots.push({x: (x << 0), y: (y << 0)});

		drawOnCanvas(color, lineSize, plots);
	}
	
	function startDraw(e) {
		e.preventDefault();
		isActive = true;
	}
	
	function endDraw(e) {
		e.preventDefault();
		isActive = false;
		
		publish({
			color: color,
			lineWidth: lineSize,
			plots: plots
		});
		plots = [];
	}
}

function checkToShowIntro() {
	if (!localStorage.getItem("noshow-" + $("#pageName").data("pagename"))) {
		$(".newIntroText").animateCss("fadeIn").removeClass("is-actually-invisible");
	}

	$(".dontShowAgainButton").on("click", function() {
		console.log("HEY");
		localStorage.setItem("noshow-" + $("#pageName").data("pagename"), "true");
		$(".newIntroText").addClass("is-actually-invisible");
	});
}