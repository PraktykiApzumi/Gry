<?php
class Dbh{
    private $host;
    private $user;
    private $pwd;
    private $dbName;

    protected function connect(){
        $this->host = "localhost";
        $this->user = "root";
        $this->pwd = "";
        $this->dbName = "planszowka";

        $dsn = "mysql:host=".$this->host.";dbname=".$this->dbName;
        $pdo = new PDO($dsn, $this->user, $this->pwd);
        return $pdo;
    }
}
?>