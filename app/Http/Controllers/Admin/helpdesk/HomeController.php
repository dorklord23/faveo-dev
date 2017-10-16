<?php

namespace App\Http\Controllers\Admin\helpdesk;
use Auth;

/**
 * -----------------------------------------------
 * HelptopicController
 * -----------------------------------------------
 * This controller renders your application's "dashboard" for users that
 * are authenticated. Of course, you are free to change or remove the
 * controller as you wish. It is just here to get your app started!
 *
 * @author      Ladybird <info@ladybirdweb.com>
 */
class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard to the user.
     *
     * @return Response
     */
    public function index()
    {
        //echo 'AAAAAAAAAAa';//Auth::id();
        return view('themes/default1/admin/dashboard');//->with('user', 'XXXXXXXXXXXXXXXX');
    }
}
