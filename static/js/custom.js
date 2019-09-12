$('#calendar').datepicker({});

! function($) {
    $(document).on("click", "ul.nav li.parent > a ", function() {
        $(this).find('em').toggleClass("fa-minus");
    });
    $(".sidebar span.icon").find('em:first').addClass("fa-plus");
}

(window.jQuery);
$(window).on('resize', function() {
    if ($(window).width() > 768) $('#sidebar-collapse').collapse('show')
})
$(window).on('resize', function() {
    if ($(window).width() <= 767) $('#sidebar-collapse').collapse('hide')
})

$(document).on('click', '.panel-heading span.clickable', function(e) {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('.panel').find('.panel-body').slideUp();
        $this.addClass('panel-collapsed');
        $this.find('em').removeClass('fa-toggle-up').addClass('fa-toggle-down');
    } else {
        $this.parents('.panel').find('.panel-body').slideDown();
        $this.removeClass('panel-collapsed');
        $this.find('em').removeClass('fa-toggle-down').addClass('fa-toggle-up');
    }
});
$(function() {
    var i = 0;
    var j = 1;
    var idName = "list-user1";
    for (i = 0; i < 200; ++i) {
        if (i != 0 && i % 15 == 0) {
            idName = "list-user" + j.toString();
            j++;
            var c = document.getElementById(idName).cloneNode(false);
            c.id = "list-user" + j.toString();
            c.style.display = "none";
            idName = "list-user" + j.toString();
            document.getElementById("container-pages").appendChild(c);
            var page = document.getElementsByClassName("page");
            var last_page = page[page.length - 1];
            var new_page = last_page.cloneNode(true);
            new_page.innerHTML = j.toString();
            new_page.className = "page";
            document.getElementById("pagination").insertBefore(new_page, last_page.nextSibling);
        }
        var b = document.getElementById(idName);
        var a = document.getElementsByClassName("item-user")[0].cloneNode(true);
        if (i == 0) b.style.display = "block";
        a.style.display = "block";
        b.appendChild(a);
    }
});
$(document).on('click', '.page', function(e) {
    let cur_index = document.querySelector('.page.active');
    document.getElementById('list-user' + cur_index.innerHTML).style.display = "none";
    if (cur_index.classList.contains('active'))
        $('.active').removeClass('active');
    this.classList.add("active");
    var s = "list-user" + e.target.innerText;
    document.getElementById(s).style.display = "block";
});
$(document).on('click', '#laquo', function(e) {
    let cur_index = document.querySelector('.page.active');
    if (cur_index != null) {
        document.getElementById('list-user' + cur_index.innerHTML).style.display = "none";
        if (cur_index.classList.contains('active'))
            $('.active').removeClass('active');
    }
    $('.page').first().addClass("active");
    document.getElementById("list-user1").style.display = "block";
});
$(document).on('click', '#raquo', function(e) {
    let cur_index = document.querySelector('.page.active');
    if (cur_index != null) {
        document.getElementById('list-user' + cur_index.innerHTML).style.display = "none";
        if (cur_index.classList.contains('active'))
            $('.active').removeClass('active');
    }
    $('.page').last().addClass("active");
    document.getElementById("list-user1").style.display = "block";
});