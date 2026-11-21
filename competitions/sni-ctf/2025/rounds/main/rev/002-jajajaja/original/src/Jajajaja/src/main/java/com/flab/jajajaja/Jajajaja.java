/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.flab.jajajaja;

/**
 *
 * @author Administrator
 */
public class Jajajaja {

    public static void main(String[] args) {
        /* Create and display the form */
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                javax.swing.JFrame frame = new javax.swing.JFrame("Jajajaja Activator");
                frame.setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);
                frame.setSize(600, 400);
                frame.setLocationRelativeTo(null); // Center on screen
                frame.getContentPane().setBackground(new java.awt.Color(30, 30, 30));
                frame.add(new CodeUI());
                frame.setVisible(true);
            }
        });
    }
}
