function addToCart(proId)
  {
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
      success:(response)=>
      {
        if(response.status)
        {
          let count=$('#cart-count').html()
          count=parseInt(count)+1
          $('#cart-count').html(count)
        }
      }
    })
  }


  $(window).on('load', function() {

    $('#js-preloader').addClass('loaded');
    
});

// Menu Dropdown Toggle
if($('.menu-trigger').length){
    $(".menu-trigger").on('click', function() { 
      $(this).toggleClass('active');
      $('.header-area .nav').slideToggle(200);
    });
  }


  // Menu elevator animation
  $('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        var width = $(window).width();
        if(width < 991) {
          $('.menu-trigger').removeClass('active');
          $('.header-area .nav').slideUp(200);  
        }       
        $('html,body').animate({
          scrollTop: (target.offset().top) + 1
        }, 700);
        return false;
      }
    }
  });


  // dropdown


    /* When the user clicks on the button, 
    toggle between hiding and showing the dropdown content */

    function myFunction() {
      document.getElementById("myDropdown").classList.toggle("show");
    }
    
    // Close the dropdown if the user clicks outside of it
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }
    

    // banner 

    var slideImg = document.getElementById('slide-img');

    var images = new Array(
      "images/img2.jpg",
      "images/img1.jpg",
      "images/img3.jpg"
    );

    var len = images.length;
    var i = 0;

    function slider()
      {
        if( i> len-1)
        {
          i=0;
        }
        slideImg.src = images[i];
        i++;
        setTimeout('slider()',3000);
      }
    
